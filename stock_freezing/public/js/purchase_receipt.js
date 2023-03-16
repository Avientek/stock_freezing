
frappe.ui.form.on('Purchase Receipt', {
	onload:function(frm){
	// 	$.each(frm.doc.items, function (k, val) {
	// 		if(val.sales_order){
	// 			frm.set_value('from_so', '1')
	// 		}
	// 	})
		frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
		.then(default_reservation_warehouse => {
			frm.set_query('set_warehouse', function(doc) {
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}
			  })
			  frm.set_query('warehouse', 'items', function(doc,cdt,cdn) {
				let row = locals[cdt][cdn];
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}}
			  )
			})
		if(frm.doc.docstatus==1 && frm.doc.from_so == 0){
			frm.add_custom_button(__("Freeze"),function (){
				let selected_customer = '';
				let d = new frappe.ui.Dialog({
					title: 'Select Items',
					fields: [
						{
							label: 'Customer',
							fieldname: 'customer',
							fieldtype: 'Link',
							options:'Customer',
							// onchange: () => {
							//
							// }
						},
						{
							fieldname: 'items',
							fieldtype: 'Table',
							data:[],
							fields:[
								{
									label: 'Item Code',
									fieldname: 'item_code',
									fieldtype: 'Link',
									reqd: true,
									read_only:1,
									in_list_view: true,
								},
								{
									label: 'Quantity',
									fieldname: 'quantity',
									fieldtype: 'Data',
									reqd: true,
									in_list_view: true,
									onchange: () => {
										// $.each(frm.doc.items, function (k, item){
											d.fields_dict.items.df.data.some(items => {
												d.fields_dict.items.grid.refresh();
												if(items.quantity > items.reserved){
													frappe.throw("Entered Quantity should not be greater than Ordered Quantity")
												}
										// })
									});
								}
								},
								{
									label: 'Warehouse',
									fieldname: 'warehouse',
									fieldtype: 'Link',
									reqd: true,
									columns:3,
									options:'Warehouse',
									in_list_view: true,
									// onchange: () => {
									// 	// d.fields_dict.items.df.data.some(items => {
									// 	// 	d.fields_dict.items.grid.refresh();
									// 	// });
									// 	d.fields_dict.items.df.data.some(items => {
									// 		// console.log(items.quantity)
									// 		set_available_qty(items.item_code, items.warehouse, d, items)
									// 	  });
									// }
								},
								// {
								// 	label: 'Available Quantity',
								// 	fieldname: 'available_qty',
								// 	fieldtype: 'Float',
								// 	reqd: true,
								// 	columns:3,
								// 	in_list_view: true
								// },
								{
									label: 'Sales Order',
									fieldname: 'sales_order',
									fieldtype: 'Link',
									read_only:1,
									options:'Sales Order',
									in_list_view: true
								},
								{
									label: 'Reserved',
									fieldname: 'reserved',
									fieldtype: 'Data',
									read_only:1
									// in_list_view: true
								},
								{
									label: 'Child Name',
									fieldname: 'child_name',
									fieldtype: 'Data',
									read_only:1,
									hidden:1
								},

							]
						}
					],

					primary_action_label: 'Freeze',
					primary_action(values){
						// to make the below steps run serially(frappe.run_serially)
						frappe.run_serially([
							// () =>$.each(values.items, function (k, val) {
							// 	$.each(frm.doc.items, function (k, item){
							// 		if (item.name == val.child_name){
							// 		if(val.quantity > (item.qty - item.reserved_quantity)){
							// 			frappe.throw("Entered Quantity should not be greater than Stock Quantity")
							// 		}
							// 	}
							// 	})
							// }),
						() => frappe.call({
							'method': 'stock_freezing.events.purchase_receipt.get_purchase_stock_entry',
							'args': {'freeze': frm.doc.name,'dialog_items':values},
							callback: function (r) {
								if(!r.exc) {
									frm.refresh();
									frappe.msgprint(__(" Purchase Receipt Frozen for {0}", [frm.doc.name]));
								}
							}
						})
					]);
						d.hide();
					}
				});
				// $.each(frm.doc.items, function (k, item) {
					
					// if ((item.qty - item.reserved_quantity) > 0){
					// 	frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
					// 		.then(default_reservation_warehouse => {
					// 	let sl_no_dict = {
					// 		// 'item_code': item.item_code,
					// 		// 'quantity': item.qty - item.reserved_quantity,
					// 		// 'warehouse':default_reservation_warehouse,
					// 		// 'sales_ref':item.sales_order_item,
					// 		// 'child_name': item.name
					// 	};
					// 	d.fields_dict.items.df.data.push(sl_no_dict);
					// 	d.fields_dict.items.grid.refresh();
					// })
					// }
				// });

				d.fields_dict['customer'].df.onchange = () => {
					if (d.get_value('customer') && d.get_value('customer') != selected_customer) {
						fetch_sales_order(d.get_value('customer'), frm, d)
						selected_customer = d.get_value('customer');
					}
				}
				d.fields_dict.items.grid.refresh();
				d.show();
			}, __('Reserve'));
		}

		if (frm.doc.docstatus == 1 && frm.doc.from_so == 1){
			frm.add_custom_button(__("Freeze"),function (){
				let e = new frappe.ui.Dialog({
					title: 'Select Items',
					fields: [
						{
							fieldname: 'items',
							fieldtype: 'Table',
							data:[],
							fields:[
								{
									label: 'Item Code',
									fieldname: 'item_code',
									fieldtype: 'Link',
									reqd: true,
									read_only:1,
									in_list_view: true,
								},
								{
									label: 'Quantity',
									fieldname: 'quantity',
									fieldtype: 'Data',
									reqd: true,
									in_list_view: true,
									onchange: () => {
										$.each(frm.doc.items, function (k, item){
											e.fields_dict.items.df.data.some(items => {
												e.fields_dict.items.grid.refresh();
												if(items.quantity > (item.qty-item.reserved_quantity)){
													frappe.throw("Entered Quantity should not be greater than Ordered Quantity")
												}
										})
									});
								}
								},
								{
									label: 'Warehouse',
									fieldname: 'warehouse',
									fieldtype: 'Link',
									options:'Warehouse',
									reqd: true,
									read_only:1,
									in_list_view: true,
									columns:2
								
								},
								{
									label: 'Sales ref',
									fieldname: 'sales_ref',
									fieldtype: 'Data',
									read_only:1,
									hidden:1
								},
								{
									label: 'Child Name',
									fieldname: 'child_name',
									fieldtype: 'Data',
									read_only:1,
									hidden:1
								},

							]
						}
					],

					primary_action_label: 'Freeze',
					primary_action(values){
						// to make the below steps run serially
						frappe.run_serially([
							() =>$.each(values.items, function (k, val) {
								$.each(frm.doc.items, function (k, item){
									if (item.name == val.child_name){
									if(val.quantity > (item.qty - item.reserved_quantity)){
										frappe.throw("Entered Quantity should not be greater than Ordered Quantity")
									}
								}
								})
							}),
						() => frappe.call({
							'method': 'stock_freezing.events.purchase_receipt.set_reserved_quantity',
							'args': {'freeze': frm.doc.name,'dialog_items':values},
							callback: function (r) {
								if(!r.exc) {
									frm.refresh();
									frappe.msgprint(__(" Purchase Receipt Frozen for {0}", [frm.doc.name]));
								}
							}
						})
					]);
						e.hide();
					}           
				});
				$.each(frm.doc.items, function (k, item) {
					
					if ((item.qty - item.reserved_quantity) > 0){
						frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
							.then(default_reservation_warehouse => {
						let sl_no_dict = {
							'item_code': item.item_code,
							'quantity': item.qty - item.reserved_quantity,
							'warehouse':default_reservation_warehouse,
							'sales_ref':item.sales_order_item,
							'child_name': item.name,
						};
						e.fields_dict.items.df.data.push(sl_no_dict);
						e.fields_dict.items.grid.refresh();
					})
					}
				});
				e.fields_dict.items.grid.refresh();
				e.show();
			}, __('Reserve'));
		}
	
	
		// if(frm.doc.docstatus==1 && frm.doc.is_frozen==1){

		// frm.add_custom_button(__("Unfreeze"),function (){

		// 	let d = new frappe.ui.Dialog({
		// 		title: 'Select Items',
		// 		fields: [
		// 				{
		// 					fieldname: 'items',
		// 					fieldtype: 'Table',
		// 					data:[],
		// 					fields:[
		// 						{
		// 							label: 'Item Code',
		// 							fieldname: 'item_code',
		// 							fieldtype: 'Link',
		// 							reqd: true,
		// 							read_only:1,
		// 							in_list_view: true
		// 						},
		// 						{
		// 							label: 'Quantity',
		// 							fieldname: 'quantity',
		// 							fieldtype: 'Data',
		// 							reqd: true,
		// 							in_list_view: true,

		// 						},
		// 						{
		// 							label: 'Warehouse',
		// 							fieldname: 'warehouse',
		// 							fieldtype: 'Link',
		// 							reqd: true,
		// 							read_only:1,
		// 							length: 2,
		// 							in_list_view: true
		// 						},
		// 						{
		// 							label: 'Child Name',
		// 							fieldname: 'child_name',
		// 							fieldtype: 'Data',
		// 							read_only:1,
		// 							hidden:1
		// 						},

		// 					]
		// 				}

		// 		],
		// 		primary_action_label: 'Unfreeze',
		// 		primary_action(values) {
		// 			frappe.run_serially([
		// 				() =>$.each(values.items, function (k, val) {
		// 					// let stock_entry = frappe.db.get_doc('Stock Entry', null, { 'sales_order': frm.doc.name, 'stock_entry_type':'Freeze'})
		// 					// .then(doc => {
		// 					// console.log(doc)
		// 					$.each(frm.doc.items, function (k, frozen) {
		// 							console.log(val.quantity)
		// 							console.log(frozen.qty)
		// 							if(val.child_name == frozen.name){
		// 								if(val.quantity > frozen.reserved_quantity){
		// 								frappe.throw("Entered Quantity should not be greater than frozen Quantity");
		// 							}
		// 						}

		// 						})

		// 				}),
		// 					() =>frappe.call({
		// 						'method': 'stock_freezing.events.purchase_receipt.unfreeze_purchase_receipt',
		// 						'args': {'unfreeze': frm.doc.name , 'dialog_items':values},
		// 						callback: function(r) {
		// 							if(!r.exc) {
		// 								frm.refresh();
		// 								frappe.msgprint(__("Stock Quantity Unfrozen for {0}", [frm.doc.name]));
		// 								frm.reload_doc();
		// 							}
		// 						}
		// 					})
		// 		]);
		// 			d.hide();
		// 		}
		// 	});


		// 		$.each(frm.doc.items, function (k, val) {
		// 			if ((val.reserved_quantity) > 0){
		// 			frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
		// 				.then(default_reservation_warehouse => {
		// 			let sl_no_dict = {
		// 				'item_code': val.item_code,
		// 				'quantity': val.reserved_quantity,
		// 				'warehouse': default_reservation_warehouse,
		// 				'child_name': val.name
		// 			};
		// 			d.fields_dict.items.df.data.push(sl_no_dict);
		// 			d.fields_dict.items.grid.refresh();
		// 		})
		// 		}
		// 	})
		// 	d.show();
		// }, __('Reserve'));

	// }


	},
	setup: function (frm) {
		frm.set_indicator_formatter("item_code", (doc) => {
			if (doc.reserved_quantity > 0){
			return "red";
		} 
		// else if ((doc.mrp ? doc.mrp : 0) == doc.last_mrp){
		// 	return "light-grey";
		// } else { // >
		// 	return "green";
		// }
		});
	}
})

var fetch_sales_order = function (customer,frm,d) {
		frappe.call({
		method: "stock_freezing.events.sales_order.get_sales_order_items",
		args: {
		customer: customer,
		items: frm.doc.items,
		company: frm.doc.company
		},
		callback: function(r) {
		if (r.message && r.message.length > 0){
			d.fields_dict.items.df.data = [];
			$.each(r.message, function (k, val) {
				// $.each(frm.doc.items, function (k, item) {
					let r_dict = {
						'item_code': val.item_code,
						'quantity': val.reserved_quantity,
						'warehouse':val.warehouse,
						'sales_order':val.name,
						'child_name': val.child_name,
						'reserved' : val.reserved_quantity

					};
					d.fields_dict.items.df.data.push(r_dict);
					d.fields_dict.items.grid.refresh();
				// })
				})
			} else {
				d.fields_dict.items.df.data = [];
				d.fields_dict.items.grid.refresh();
			}
			}
		});
	};

	// var set_available_qty = function (item_code, warehouse, d, items) {
	// 	let k = 0
	// 		frappe.call({
	// 		method: "erpnext.stock.get_item_details.get_bin_details",
	// 		args: {
	// 		warehouse: warehouse,
	// 		item_code: item_code
	// 		},
	// 		callback: function(r) {
	// 		if (r.message){
	// 			if (r.message.actual_qty) {
	// 				// k = r.message.actual_qty
	// 				// return k
	// 				items.available_qty = r.message.actual_qty
	// 				d.fields_dict.items.grid.refresh();
	// 			}
	// 		}
	// 		}
	// 	});
	// };
