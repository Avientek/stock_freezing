frappe.ui.form.on('Delivery Note',{
    onload_post_render: function(frm) {
        // Iterate over each item in the Delivery Note
        $.each(frm.doc.items, function(k, val) {
            if (val.reserved_quantity > 0 && val.reserved_quantity <= val.qty) {
                frappe.db.get_list('Frozen Stock', {
                    fields: ['item_code', 'warehouse', 'quantity', 'name'],
                    filters: {
                        item_code: val.item_code,
                        sales_order: val.against_sales_order,
                        sales_order_item: val.so_detail
                    },
                    limit: 0
                }).then(records => {
                	console.log("records for item", val.item_code,records)
                    if (records.length > 0) {
                        let total_reserved = 0;

                        // Process each record in the Frozen Stock
                        records.forEach(rec => {
                            total_reserved += rec.quantity;
                            console.log("frozen qty", rec.quantity)
                            // Add a new row for the frozen stock item
                            frm.add_child('items', {
                                item_code: rec.item_code,
                                item_name: val.item_name,
                                description: val.description,
                                uom: val.uom,
                                rate: val.rate,
                                warehouse: rec.warehouse,
                                qty: rec.quantity,
                                reserved_quantity: rec.quantity,
                                against_sales_order: val.against_sales_order,
                                so_detail: val.so_detail,
                                custom_frozen_stock: rec.name
                            });
                        });
                        console.log("total reserved qty and dn qty",total_reserved,val.qty)
                        // Tag the original item for removal or update its quantity
                        if (total_reserved < val.qty) {
                        	console.log("qty changed to qty - reserved")
                            frappe.model.set_value(val.doctype, val.name, 'qty', (val.qty - total_reserved));
                        } else {
                        	console.log("total_reserved >= dn qty:: remove")
                            // Tag the item for removal
                            val.__remove = true;
                        }

                        // Refresh fields after processing
                        frm.refresh_field('items');
                    }
                });
            }
        });

        // Remove items tagged for deletion
        setTimeout(() => {
	        frappe.after_ajax(() => {
	            const items = frm.doc.items.filter(item => !item.__remove);
	            console.log("to be kept",items)
	            frm.clear_table("items");
	            items.forEach(item => frm.add_child("items", item));
	            frm.refresh_field('items');
	        });
	    },150)
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