frappe.ui.form.on('Delivery Note',{
	onload_post_render:function(frm){
		$.each(frm.doc.items, function (k, val){
			if(val.reserved_quantity > 0 && val.reserved_quantity <= val.qty){
				frappe.db.get_list('Frozen Stock', {
	                fields: ['item_code','warehouse','quantity','name'],
	                filters: {
	                    item_code: val.item_code,
	                    sales_order: val.against_sales_order,
	                    sales_order_item: val.so_detail
	                },
	                limit:0
		            }).then(records => {
		            	console.log("recorsssssssss",records)
		            	var total_reserved = 0
		                records.forEach(rec=>{
		                	total_reserved += rec.quantity
		                    frm.add_child('items',{
		                        item_code: rec.item_code,
								item_name :val.item_name,
								description :val.description,
								uom :val.uom,
								rate :val.rate,
								warehouse :rec.warehouse,
								qty :rec.quantity,
								reserved_quantity :rec.quantity,
								against_sales_order :val.against_sales_order,
								so_detail :val.so_detail,
								custom_frozen_stock:rec.name
		                    });
		                    frm.refresh_fields('items');
			            });
		            if(total_reserved < val.qty){
		            	frappe.model.set_value(val.doctype, val.name, 'qty', (val.qty - total_reserved))
			        }
			        else if(total_reserved == val.qty) {
			        	frm.get_field("items").grid.grid_rows[k].remove();
			        }
			    });

				}
			})
		},
	delivery_warehouse(frm) {
		if (frm.doc.delivery_warehouse && frm.doc.items && frm.doc.items.length) {
			$.each(frm.doc.items || [], function(i, item) {
				if(!item.custom_frozen_stock){
					frappe.model.set_value("Delivery Note Item", item.name, "warehouse",frm.doc.delivery_warehouse);
				}
			});
		}
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
		frm.set_query('delivery_warehouse', function () {
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
})