frappe.ui.form.on('Purchase Order', {
	refresh: function (frm) {
		frm.add_custom_button(__('Sales Order'),
			function () {
				erpnext.utils.map_current_doc({
					method: "stock_freezing.events.purchase_order.get_sales_orders",
					source_doctype: "Sales Order",
					target: me.frm,
					setters: {
						customer: undefined,
						delivery_date: undefined,
					},
					get_query_filters: {
						docstatus: 1,
						status: ["in", ["To Deliver", "To Deliver and Bill"]],
						company: ["=", frm.doc.company]
					},
				})
			}, __("Get Items From"));
	},
	onload: function (frm) {

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
	}
})