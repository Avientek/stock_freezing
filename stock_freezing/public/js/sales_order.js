frappe.ui.form.on('Sales Order', {
	refresh: function(frm) {
		if (frm.doc.docstatus == 1) {
			let show_freeze_btn = false;
			let show_unfreeze_btn = false;
			$.each(frm.doc.items, function (k, item) {
				if (item.qty > item.delivered_qty && item.qty > item.reserved_quantity) {
					show_freeze_btn = true;
				}
				if (item.qty > item.delivered_qty && item.reserved_quantity > 0) {
					show_unfreeze_btn = true;
				}
			})
			if (show_freeze_btn) {
				frm.add_custom_button(__("Freeze"), function () {
					freeze(frm);
				}, __('Reserve'));
			}
			if (show_unfreeze_btn) {
				frm.add_custom_button(__("Unfreeze"), function () {
					unfreeze(frm);
				}, __('Reserve'));
			}
			frm.add_custom_button(__('Frozen Stock'), function () {
				frappe.set_route('query-report', 'Frozen Stock',{'sales_order':frm.doc.name});
			});
		}

		frm.set_query('warehouse', 'items', function (doc, cdt, cdn) {
			let row = locals[cdt][cdn];
			return {
				"filters": [
					["company", "=",frm.doc.company],
					["custom_is_reserved_warehouse","=",0],
					['is_group', '=', 'No']
				]
			}
		})

		frm.set_query('set_warehouse', function () {
			return {
				"filters": [
					['company', '=', frm.doc.company],
					['custom_is_reserved_warehouse', '=', 0],
					['is_group', '=', 'No']
				]
			}
		})
	},
	onload: function (frm) {
		if (frm.doc.__islocal) {
			// this is to make reserved_quantity 0 on duplication
			// no_copy can't be added because this field has to be-
			// carry forwarded to PO
			$.each(frm.doc.items, function (k, val) {
				if (val.reserved_quantity) {
					frappe.model.set_value(val.doctype, val.name, 'reserved_quantity', 0)
				}

			})
		}
	},

	setup: function (frm) {
		frm.set_indicator_formatter("item_code", (doc) => {
			if (doc.reserved_quantity > 0) {
				return "purple";
			}
		});
	},

})

var set_available_qty = function (item_code, warehouse, d, items) {
    frappe.call({
        method: "erpnext.stock.get_item_details.get_bin_details",
        args: {
            warehouse: warehouse,
            item_code: item_code
        },
        callback: function (r) {
            var available_qty = r.message && r.message.actual_qty ? r.message.actual_qty : 0;
            // Update the available quantity for the item
            var itemIndex = d.fields_dict.items.df.data.findIndex(item => item.item_code === item_code);
            if (itemIndex !== -1) {
                d.fields_dict.items.df.data[itemIndex].available_qty = available_qty;
                frappe.db.get_value("Warehouse",warehouse, "custom_reservation_warehouse", function(value) {
                	console.log("custom_reservation_warehouse",value.custom_reservation_warehouse)
                	d.fields_dict.items.df.data[itemIndex].to_warehouse = value.custom_reservation_warehouse
				});
                d.fields_dict.items.grid.refresh();
            }
        }
    });
};
	 


var freeze = function(frm) {
	let d = new frappe.ui.Dialog({
		title: 'Select Items',
		fields: [
			{
				fieldname: 'items',
				fieldtype: 'Table',
				data: [],
				fields: [
					{
						label: 'Item Code',
						fieldname: 'item_code',
						fieldtype: 'Link',
						reqd: true,
						read_only: 1,
						in_list_view: true
					},
					{
						label: 'Quantity',
						fieldname: 'quantity',
						fieldtype: 'Data',
						reqd: true,
						in_list_view: true,
						columns: 2,
						onchange: () => {
							d.fields_dict.items.df.data.some(items => {
								d.fields_dict.items.grid.refresh();
								if (items.quantity > items.freeze_qty) {
									frappe.throw("Entered Quantity should not be greater than Stock Quantity")
								}
							});
						}
					},
					{
						label: 'Warehouse',
						fieldname: 'warehouse',
						fieldtype: 'Link',
						reqd: true,
						columns: 3,
						options: 'Warehouse',
						in_list_view: true,
						get_query: () => {
							return {
								filters: {
									'custom_reservation_warehouse': ['!=', ''],
									'custom_is_reservation_warehouse' : ['=',1],
									'company': frm.doc.company
								}
							};
						},
						onchange: () => {
							d.fields_dict.items.df.data.some(items => {
								set_available_qty(items.item_code, items.warehouse, d, items)
							});
						}
					},
					{
						label: 'To Warehouse',
						fieldname: 'to_warehouse',
						fieldtype: 'Link',
						read_only: 1,
						options: 'Warehouse',
					},
					{
						label: 'Available Quantity',
						fieldname: 'available_qty',
						fieldtype: 'Float',
						reqd: true,
						read_only: 1,
						columns: 3,
						in_list_view: true
					},
					{
						label: 'Child Name',
						fieldname: 'child_name',
						fieldtype: 'Data',
						read_only: 1,
						hidden: 1
					},
					{
						label: 'Freeze Qty',
						fieldname: 'freeze_qty',
						fieldtype: 'Data',
						read_only: 1,
					},

				]
			}
		],

		primary_action_label: 'Freeze',
		primary_action(values) {
			// to make the below steps run serially
			frappe.run_serially([
				() => $.each(values.items, function (k, val) {
					$.each(frm.doc.items, function (k, item) {
						if (item.name == val.child_name) {
							if (val.quantity > (item.qty - item.reserved_quantity)) {
								frappe.throw("Entered Quantity should not be greater than Ordered Quantity")
							}
						}
					})
				}),
				() => frappe.call({
					'method': 'stock_freezing.events.sales_order.freeze_unfreeze',
					'args': {
						'docname': frm.doc.name,
						'doctype': frm.doc.doctype,
						'stock_entry_type':'Freeze',
						'dialog_items': values,
					},
					callback: function (r) {
						if (!r.exc) {
							frappe.msgprint(__("Stock Reservation was Successfull"));
							frm.reload_doc();
							frm.refresh_field("items");
						}
					}
					
				})
				
			]);
			d.hide();
		}
	});
	$.each(frm.doc.items, function (k, item) {
		let sl_no_dict = {}
		if (item.qty > item.delivered_qty && item.qty > item.reserved_quantity) {
			let sl_no_dict = {
				'item_code': item.item_code,
				'quantity': item.qty - item.reserved_quantity,
				'child_name': item.name,
				'freeze_qty': item.qty - item.reserved_quantity
			};
			d.fields_dict.items.df.data.push(sl_no_dict);
		}

		d.fields_dict.items.grid.refresh();
		d.show();
	});
}

let unfreeze = function(frm) {
	let d = new frappe.ui.Dialog({
		title: 'Select Items',
		fields: [
			{
				fieldname: 'items',
				fieldtype: 'Table',
				data: [],
				fields: [
					{
						label: 'Item Code',
						fieldname: 'item_code',
						fieldtype: 'Link',
						reqd: true,
						read_only: 1,
						in_list_view: true
					},
					{
						label: 'Quantity',
						fieldname: 'quantity',
						fieldtype: 'Data',
						reqd: true,
						in_list_view: true,
						onchange: () => {
							$.each(frm.doc.items, function (k, item) {
								d.fields_dict.items.df.data.some(items => {
									d.fields_dict.items.grid.refresh();
									if (items.quantity > items.unfreeze) {
										frappe.throw("Entered Quantity should not be greater than frozen Quantity")

									}
								})
							});
						}
					},
					{
						label: 'Warehouse',
						fieldname: 'warehouse',
						fieldtype: 'Link',
						reqd: true,
						read_only: 1,
						in_list_view: true
					},
					{
						label: 'To Warehouse',
						fieldname: 'to_warehouse',
						fieldtype: 'Link',
						read_only: 1,
						options: 'Warehouse',
					},
					{
						label: 'Child Name',
						fieldname: 'child_name',
						fieldtype: 'Data',
						read_only: 1,
						hidden: 1
					},
					{
						label: 'Unfreeze',
						fieldname: 'unfreeze',
						fieldtype: 'Data',
						read_only: 1,
						hidden: 1
					}

				]
			}
		],
		primary_action_label: 'Unfreeze',
		primary_action(values) {
		

			frappe.run_serially([
				() => $.each(values.items, function (k, val) {
						$.each(frm.doc.items, function (k, frozen) {
							if (val.child_name == frozen.name) {
								if (val.quantity > frozen.reserved_quantity) {
									frappe.throw("Entered Quantity should not be greater than frozen Quantity");
								}
							}
						})
					}),
				() => frappe.call({
					'method': 'stock_freezing.events.sales_order.freeze_unfreeze',
					'args': {
						'docname': frm.doc.name,
						'doctype': frm.doc.doctype,
						'stock_entry_type':'Unfreeze',
						'dialog_items': values,
					},
					callback: function (r) {
						if (!r.exc) {
							frappe.msgprint(__("Stock unfreezing was Successfull"));
							frm.reload_doc();
							frm.refresh_field("items");
						}
					}
				})
			]);
			d.hide();
		}
	});

	frappe.call({
		'method': 'stock_freezing.events.sales_order.get_so_frozen_data',
		'args': {
		'docname': frm.doc.name,
	},
	callback: function (response) {
		let child_name;
		$.each(response.message,function (k, msg) {

				$.each(frm.doc.items,function(k,item){
					if(item.item_code == msg.item_code){
						child_name = item.name
					}
				}							
			)
			let sl_no_dict = {
				'item_code': msg.item_code,
				'quantity': msg.quantity,
				'warehouse':msg.warehouse,
				'to_warehouse':msg.from_warehouse,
				'child_name': child_name,
				'unfreeze': frm.doc.items.reserved_quantity,
			};
			d.fields_dict.items.df.data.push(sl_no_dict);
			d.fields_dict.items.grid.refresh();
		})
			
		
		}
	})

	d.show();
}
