import frappe
from frappe.model.mapper import get_mapped_doc


@frappe.whitelist()
def get_sales_orders(source_name, target_doc=None, args=None):
	target_doc = get_mapped_doc(
		"Sales Order",
		source_name,
		{
			"Sales Order": {
				"doctype": "Purchase Order",
				"field_no_map": ["inter_company_order_reference", "shipping_address"],
			},
			"Sales Order Item": {
				"doctype": "Purchase Order Item",
				"field_map": [
					["name", "sales_order_item"],
					["parent", "sales_order"],
				],
			},
		},
		target_doc,
	)

	return target_doc
