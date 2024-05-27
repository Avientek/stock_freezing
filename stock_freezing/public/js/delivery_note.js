frappe.ui.form.on('Delivery Note',{
	onload:function(frm){
		frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
		.then(r => {
		if(r.message.default_reservation_warehouse){
			frm.set_query('set_warehouse', function(doc) {
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}
			  })
			  frm.set_query('warehouse', 'items', function(doc,cdt,cdn) {
				let row = locals[cdt][cdn];
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}}
			  )
			// frm.set_value('set_warehouse', default_reservation_warehouse)
			 $.each(frm.doc.items, function (k, val){
				if(val.reserved_quantity > 0 && val.reserved_quantity < val.qty){
					val.qty = val.reserved_quantity
					frappe.model.set_value(val.doctype, val.name, 'warehouse', r.message.default_reservation_warehouse)
				// adding additinal row in delevery note item table
					var d = frappe.model.add_child(frm.doc, "Delivery Note Item", "items");
					d.item_code = val.item_code
					d.item_name = val.item_name
					d.description = val.description
					d.uom = val.uom
					d.rate = val.rate
					d.qty = val.actual_quantity -val.reserved_quantity
					d.amount = d.qty*d.rate
					d.against_sales_order = val.against_sales_order
					d.so_detail = val.so_detail
					d.actual_quantity = val.actual_quantity
				}
		})
	}})
		},
	setup: function (frm) {
		frm.set_indicator_formatter("item_code", (doc) => {
			if (doc.reserved_quantity > 0){
			return "purple";
		}
		 else {
			return "green";
		}
		});

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
		)
		frm.set_query('set_warehouse', function () {
			return {
				"filters": [
					['company', '=', frm.doc.company],
					['custom_is_reserved_warehouse', '=', 0],
					['is_group', '=', 'No']
				]
			}
		})
		frm.set_query('set_target_warehouse', function () {
			return {
				"filters": [
					['company', '=', frm.doc.company],
					['custom_is_reserved_warehouse', '=', 0],
					['is_group', '=', 'No']
				]
			}
		})

	},
	// company: function(frm) {
    //     // Call the Python function to get filtered warehouses
    //     frappe.call({
    //         method: 'stock_freezing.events.warehouse.get_filtered_warehouses',
	// 		args:{
	// 			"company" : frm.doc.company
	// 		},
    //         callback: function(response) {
    //             if (response.message) {
	// 				console.log(response.message, 1111111111)
    //                 // Set the query for your warehouse field
    //                 frm.set_query('set_warehouse', function() {
    //                     return {
    //                         filters: [
    //                             ['Warehouse', 'name', 'in', response.message],
	// 							['Warehouse', 'company', '=', frm.doc.company]
    //                         ],
	// 						page_length:50
    //                     };
    //                 });
    //             }
    //         }
    //     });
    // }
})