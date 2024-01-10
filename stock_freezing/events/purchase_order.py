import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt


@frappe.whitelist()
def get_sales_orders(source_name, target_doc=None, args=None):
	def update_item(obj, target, source_parent):
		target.qty = flt(obj.qty) - flt(obj.ordered_qty)

	def condition(doc):
		return abs(doc.qty) - abs(doc.ordered_qty) > 0


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
				"postprocess": update_item,
				"condition": condition,
			},
		},
		target_doc,
	)

	return target_doc
