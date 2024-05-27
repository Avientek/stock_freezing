import frappe
import json


def validate(self,method):
	for i in self.items:
		if i.sales_order:
			self.from_so = 1

@frappe.whitelist()
def freeze_from_pr(docname, doctype, dialog_items, type):
	doc=frappe.get_doc(doctype, docname)
	reserved=json.loads(dialog_items)
	# reserve_warehouse=frappe.db.get_value('Company', doc.company, 'default_reservation_warehouse')
	reserve_warehouse=frappe.db.get_value('Warehouse', doc.set_warehouse, 'custom_reservation_warehouse')
	item_details = reserved.get('items')

	stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'from_warehouse':doc.set_warehouse,
		'company': doc.company,
		'to_warehouse':reserve_warehouse,
		'stock_entry_type':'Freeze',
		'purchase_receipt':doc.name,
	})
	for item in item_details:
		warehouse = ""
		if type=="freeze_wo_so":
			warehouse, pr_item_name = frappe.db.get_value('Purchase Receipt Item', {'item_code': item.get('item_code'), 'parent':docname}, ["warehouse", "name"])
		else:
			warehouse = frappe.db.get_value('Purchase Receipt Item', {'name': item.get('child_name')}, ["warehouse"])
		stock.append('items', {
			"item_code": item.get('item_code'),
			"qty":item.get('quantity'),
			"conversion_factor":1,
			"basic_rate":item.get('rate'),
			"amount": item.get('amount'),
			"t_warehouse": reserve_warehouse,
			"s_warehouse": warehouse,
			"allow_zero_valuation_rate":1,
			"sales_order_item":item.get('sales_ref'),
			"avientek_pr_item":item.get('child_name') if type=="freeze" else pr_item_name,
		})
	stock.insert().submit()
