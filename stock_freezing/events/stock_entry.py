import frappe
from frappe.model.mapper import get_mapped_doc


def on_submit(self, method):
	if self.stock_entry_type == "Freeze":
		for item in self.items:
			if item.sales_order_item:
				so_item_dict = frappe.db.get_value("Sales Order Item", item.sales_order_item, ['reserved_quantity', 'qty'], as_dict=1)
				if float(so_item_dict.reserved_quantity) + float(item.qty) <= so_item_dict.qty:
					frappe.db.set_value("Sales Order Item", item.sales_order_item, "reserved_quantity", float(so_item_dict.reserved_quantity) + float(item.qty))
			if item.avientek_pr_item:
				pr_item_dict = frappe.db.get_value("Purchase Receipt Item", item.avientek_pr_item, ['reserved_quantity', 'qty'], as_dict=1)
				if float(pr_item_dict.reserved_quantity) + float(item.qty) <= pr_item_dict.qty:
					frappe.db.set_value("Purchase Receipt Item", item.avientek_pr_item, "reserved_quantity", float(pr_item_dict.reserved_quantity) + float(item.qty))

	elif self.stock_entry_type == "Unfreeze":
		for item in self.items:
			if item.sales_order_item and item.sales_order:
				so_item_dict = frappe.db.get_value("Sales Order Item", item.sales_order_item, ['reserved_quantity', 'qty'], as_dict=1)
				if float(so_item_dict.qty) >= float(so_item_dict.reserved_quantity) - float(item.get('qty')):
					set_qty = 0
					if float(so_item_dict.reserved_quantity) - float(item.get('qty')) >= 0:
						set_qty = float(so_item_dict.reserved_quantity) - float(item.get('qty'))
					frappe.db.set_value("Sales Order Item", item.sales_order_item, "reserved_quantity", set_qty)


# def on_cancel(self, method):
# 	return
	# if self.stock_entry_type == "Freeze":
	# 	if self.items:
	# 		for i in self.items:
	# 			if i.sales_order_item and i.sales_order:
	# 				reserved_qty = frappe.db.get_value('Sales Order Item', i.sales_order_item, 'reserved_quantity')
	# 				if reserved_qty:
	# 					update_reserved_qty = i.qty - reserved_qty
	# 					frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', update_reserved_qty)
	
	# if self.stock_entry_type == "Unfreeze":
	# 	if self.items:
	# 		for i in self.items:
	# 			if i.sales_order_item and i.sales_order:
	# 				reserved_qty = frappe.db.get_value('Sales Order Item', i.sales_order_item, 'reserved_quantity')
	# 				if reserved_qty >= 0:
	# 					update_reserved_qty = i.qty + reserved_qty
	# 					frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', update_reserved_qty)


@frappe.whitelist()
def get_sales_orders(source_name, target_doc=None, args=None):
	target_doc = get_mapped_doc(
		"Sales Order",
		source_name,
		{
			"Sales Order": {
				"doctype": "Purchase Order",
			"field_no_map": ["inter_company_order_reference"],
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
		# postprocess,
	)

	return target_doc

