
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
		}
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
		frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
			.then(r => {
				if (r.message.default_reservation_warehouse) {
					frm.set_query('set_warehouse', function (doc) {
						return {
							"filters": [
								['company', '=', frm.doc.company],
								['name', '!=', r.message.default_reservation_warehouse],
								['is_group', '=', 'No']
							]
						}
					})
					frm.set_query('warehouse', 'items', function (doc, cdt, cdn) {
						let row = locals[cdt][cdn];
						return {
							"filters": [
								['company', '=', frm.doc.company],
								['name', '!=', r.message.default_reservation_warehouse],
								['is_group', '=', 'No']
							]
						}
					}
					)
				}
			})
	},

	setup: function (frm) {
		frm.set_indicator_formatter("item_code", (doc) => {
			if (doc.reserved_quantity > 0) {
				return "purple";
			}
			// else if ((doc.mrp ? doc.mrp : 0) == doc.last_mrp){
			// 	return "light-grey";
			// } else { // >
			// 	return "green";
			// }
		});
	},

})

var set_available_qty = function (item_code, warehouse, d, items) {
	let k = 0
	frappe.call({
		method: "erpnext.stock.get_item_details.get_bin_details",
		args: {
			warehouse: warehouse,
			item_code: item_code
		},
		callback: function (r) {
			if (r.message) {
				if (r.message.actual_qty) {
					items.available_qty = r.message.actual_qty
					d.fields_dict.items.grid.refresh();
				}
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
						read_only: 1,
						options: 'Warehouse',
						in_list_view: true,
						onchange: () => {
							// d.fields_dict.items.df.data.some(items => {
							// 	d.fields_dict.items.grid.refresh();
							// });
							d.fields_dict.items.df.data.some(items => {
								set_available_qty(items.item_code, items.warehouse, d, items)
							});
						}
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
					'method': 'stock_freezing.events.sales_order.freeze',
					'args': {
						'docname': frm.doc.name,
						'doctype': frm.doc.doctype,
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
		console.log(item.qty, item.reserved_quantity, item.qty > item.reserved_quantity)
		if (item.qty > item.delivered_qty && item.qty > item.reserved_quantity) {
			let sl_no_dict = {
				'item_code': item.item_code,
				'quantity': item.qty - item.reserved_quantity,
				'warehouse': item.warehouse,
				'available_qty': item.actual_qty,
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
					// let stock_entry = frappe.db.get_doc('Stock Entry', null, { 'sales_order': frm.doc.name, 'stock_entry_type':'Freeze'})
					// .then(doc => {
					$.each(frm.doc.items, function (k, frozen) {
						if (val.child_name == frozen.name) {
							if (val.quantity > frozen.reserved_quantity) {
								frappe.throw("Entered Quantity should not be greater than frozen Quantity");
							}
						}
					})
				}),
				() => frappe.call({
					'method': 'stock_freezing.events.sales_order.unfreeze',
					'args': {
						'docname': frm.doc.name,
						'doctype': frm.doc.doctype,
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

	// let stock_entry = frappe.db.get_doc('Stock Entry', null, { 'sales_order': frm.doc.name, 'stock_entry_type':'Freeze'})
	// .then(doc => {
	$.each(frm.doc.items, function (k, val) {
		if (val.reserved_quantity > 0 && val.qty != val.delivered_qty) {
			frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
				.then(r => {
					if (r.message.default_reservation_warehouse) {
						let sl_no_dict = {
							'item_code': val.item_code,
							'quantity': val.reserved_quantity,
							'warehouse': r.message.default_reservation_warehouse,
							'child_name': val.name,
							'unfreeze': val.reserved_quantity,
						};
						d.fields_dict.items.df.data.push(sl_no_dict);
						d.fields_dict.items.grid.refresh();
					}
				})
		}
		d.show();
		d.show();
	})

	// });
	// d.fields_dict.items.grid.refresh();



}