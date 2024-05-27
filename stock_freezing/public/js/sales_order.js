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
		frm.set_query('warehouse', 'items', function (doc, cdt, cdn) {
			let row = locals[cdt][cdn];
			return {
				"filters": [
					["company", "=",frm.doc.company],
					["custom_is_reserved_warehouse","=",0],
					['is_group', '=', 'No']
				]
			}
		}
		),

		// frappe.db.get_value('Warehouse', {"company":frm.doc.company}, 'name')
		// 	.then(r => {
		// 		if (r.message.name) {
					frm.set_query('set_warehouse', function () {
						return {
							"filters": [
								['company', '=', frm.doc.company],
								['custom_is_reserved_warehouse', '=', 0],
								['is_group', '=', 'No']
							]
						}
					})
			// 	}
			// })

			// refresh: function(frm){
			// 	frm.set_query('warehouse', 'items', function(doc, cdt, cdn) {
			//   let row = locals [cdt][cdn]
			//   return {
			// 	filters: {
			// 	  is_group: 0,
			// 	  company : frm.doc.company
		
			// 	}
			//   };
			// });
			// }
	},
	// setup: function(frm){
	// 	frm.set_query('warehouse','items', function(frm,cdt,cdn){
	// 		const row = locals[cdt][cdn]
	// 		return{
	// 			filters:{
	// 				"custom_is_reserved_warehouse": 0,
	// 			}
	// 		}
	// 	})
	// },
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
					// frm.set_query('warehouse', 'items', function (doc, cdt, cdn) {
					// 	let row = locals[cdt][cdn];
					// 	return {
					// 		"filters": [
					// 			['company', '=', frm.doc.company],
					// 			['name', '!=', r.message.default_reservation_warehouse],
					// 			['is_group', '=', 'No']
					// 		]
					// 	}
					// }
					// )
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

// var set_available_qty = function (item_code, warehouse, d, items) {
// 	let k = 0
// 	frappe.call({
// 		method: "erpnext.stock.get_item_details.get_bin_details",
// 		args: {
// 			warehouse: warehouse,
// 			item_code: item_code
// 		},
// 		callback: function (r) {
// 			if (r.message) {
// 				if (r.message.actual_qty) {
// 					items.available_qty = r.message.actual_qty
// 					d.fields_dict.items.grid.refresh();
// 				}
// 			}
// 		}
// 	});
// };
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
						// read_only: 1,
						options: 'Warehouse',
						in_list_view: true,
						get_query: () => {
							return {
								filters: {
									'custom_reservation_warehouse': ['!=', ''],
									'custom_is_reservation_warehouse' : ['=',1]
								}
							};
						},
						onchange: () => {
							// d.fields_dict.items.df.data.some(items => {
							// 	d.fields_dict.items.grid.refresh();
							// });
							d.fields_dict.items.df.data.some(items => {
								set_available_qty(items.item_code, items.warehouse, d, items)
							});
						}
					},
					// {
					// 	label: 'To Warehouse',
					// 	fieldname: 'to_warehouse',
					// 	fieldtype: 'Link',
					// 	reqd: true,
					// 	columns: 3,
					// 	// read_only: 1,
					// 	options: 'Warehouse',
					// 	in_list_view: true,
					// 	// onchange: function() {
					// 				//     // Ensure to retrieve the 'to_warehouse' value after it's changed
					// 				//     d.custom_reserve_warehouse = d.get_value('to_warehouse');
					// 				// }
					//   },
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
		// console.log(item.qty, item.reserved_quantity, item.qty > item.reserved_quantity)
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
                        label: 'To Warehouse',
                        fieldname: 'to_warehouse',
                        fieldtype: 'Link',
                        options: 'Warehouse',
                        reqd: true,
						in_list_view: true,
						read_only:1
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

// 	frappe.db.get_value("Stock Entry",{"sales_order":frm.doc.name, "stock_entry_type":"Freeze"},"name")
//   .then(r => {
//     frappe.db.get_doc("Stock Entry",r.message.name)
//     .then(res =>{
//       console.log(res,22222)
//       $.each(res.items, function(k,item){
//         console.log(item,88888)
//         // let remaining_qty = item.qty - item.reserved_quantity;
//         // let sl_no_dict = {}
//         // if (item.qty > item.delivered_qty && item.qty > item.reserved_quantity) {
//           let sl_no_dict = {
//             'item_code': item.item_code,
//             'quantity': item.qty,
//             'warehouse': item.t_warehouse,
//             'to_warehouse': item.s_warehouse,
//             'available_qty': item.actual_qty,
//             'child_name': item.name,
//             'freeze_qty': item.qty - item.reserved_quantity
//           };
//           d.fields_dict.items.df.data.push(sl_no_dict);
//         // }
        
//         d.fields_dict.items.grid.refresh();
//         d.show();
      
//       })
        

//     })
//   })

	// let stock_entry = frappe.db.get_doc('Stock Entry', null, { 'sales_order': frm.doc.name, 'stock_entry_type':'Freeze'})
	// .then(doc => {



	// $.each(frm.doc.items, function (k, item) {
		// if(item.reserved_quantity>0 && item.qty !=item.delivered_qty){
					frappe.call({
						'method': 'stock_freezing.events.sales_order.get_warehouse',
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
								'warehouse': msg.to_warehouse,
								'to_warehouse':msg.warehouse,
								'child_name': child_name,
								'unfreeze': frm.doc.items.reserved_quantity,
							};
							d.fields_dict.items.df.data.push(sl_no_dict);
							d.fields_dict.items.grid.refresh();
						})
							
						
						}
					})
					
				
		// }
		d.show();
		d.show();
		
	// })


	
		// if (frm.doc.items[0].reserved_quantity > 0 && frm.doc.items[0].qty != frm.doc.items[0].delivered_qty) {
			// frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
			// 	.then(r => {
			// 		frappe.call({
			// 			'method': 'stock_freezing.events.sales_order.get_warehouse',
			// 			'args': {
			// 			'docname': frm.doc.name,
			// 		},
			// 		callback: function (response) {
			// 			if (r.message.default_reservation_warehouse) {
			// 			$.each(response.message,function (k, msg) {
			// 				let sl_no_dict = {
			// 					'item_code': msg.item_code,
			// 					'quantity': msg.quantity,
			// 					'warehouse': r.message.default_reservation_warehouse,
			// 					'to_warehouse':msg.warehouse,
			// 					'child_name': frm.doc.items[0].name,
			// 					'unfreeze': frm.doc.items[0].reserved_quantity,
			// 				};
			// 				d.fields_dict.items.df.data.push(sl_no_dict);
			// 				d.fields_dict.items.grid.refresh();
			// 				console.log(msg)
			// 			})
							
			// 			}
			// 			}
			// 		})
					
			// 	})
		// }
		// d.show();
		// d.show();
	
	// $.each(frm.doc.items, function (k, val) {
	// 	if (val.reserved_quantity > 0 && val.qty != val.delivered_qty) {
	// 		frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
	// 			.then(r => {
	// 				if (r.message.default_reservation_warehouse) {
	// 					let sl_no_dict = {
	// 						'item_code': val.item_code,
	// 						'quantity': val.reserved_quantity,
	// 						'warehouse': r.message.default_reservation_warehouse,
	// 						'child_name': val.name,
	// 						'unfreeze': val.reserved_quantity,
	// 					};
	// 					d.fields_dict.items.df.data.push(sl_no_dict);
	// 					d.fields_dict.items.grid.refresh();
	// 				}
	// 			})
	// 	}
	// 	d.show();
	// 	d.show();
	// })

	// });
	// d.fields_dict.items.grid.refresh();



}

// frappe.ui.form.on("Sales Order Item",{
// 	warehouse: function(frm,cdt,cdn){
// 		frm.set_query('warehouse',()=>{
// 			const row = locals[cdt][cdn]
// 			return{
// 				filters:{
// 					"custom_is_reserved_warehouse": 1,
// 				}
// 			}
// 		}, setTimeout(() => {
			
// 		}, 500
// 	))
// 	}
// })

// frappe.ui.form.on("Sales Order Item", {
//     warehouse: function(frm, cdt, cdn) {
//         frm.set_query('warehouse', function() {
//             const row = locals[cdt][cdn];
//             return {
//                 filters: {
//                     "custom_is_reserved_warehouse": 1
//                 }
//             };
//         });
//     }
// });
