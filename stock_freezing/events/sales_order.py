import frappe
import json


def validate(self,method):
	for i in self.items:
		if i.qty:
			i.actual_quantity = i.qty


@frappe.whitelist()
def create_stock_entry(freeze, dialog_items):
	reserved=json.loads(dialog_items)
	reserved_warehouse=frappe.db.get_value("Stock Settings", "Stock Settings", "default_reservation_warehouse")
	item_details=reserved['items']
	doc=frappe.get_doc('Sales Order',freeze)
	stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'from_warehouse': doc.set_warehouse,
		'to_warehouse':reserved_warehouse,
		'stock_entry_type':'Freeze',
		'sales_order':doc.name
	})
	for item in item_details:
		item_code=item.get('item_code')
		rate=item.get('rate')
		amount=item.get('amount')
		quantity=item.get('quantity')
		source_warehouse=item.get('warehouse')
		stock.append('items', {
		"item_code": item_code,
		"qty":quantity,
		"conversion_factor":1,
		"t_warehouse":reserved_warehouse,
		"allow_zero_valuation_rate":1,
		"basic_rate":rate,
		"s_warehouse":source_warehouse,
		"amount":amount
		})
	stock.insert()
	stock.submit()
	for item in item_details:
		for i in doc.items:
			r_quantity = i.reserved_quantity + float(item.get('quantity'))
			frappe.db.set_value('Sales Order Item', item.get('child_name'), 'reserved_quantity', r_quantity)
	frappe.db.set_value('Sales Order', doc.name, 'is_frozen', 1)



@frappe.whitelist()
def unfreeze_sales_order(unfreeze, dialog_items):
	unfreeze_dict = json.loads(dialog_items)
	unfreeze_items = unfreeze_dict['items']
	reserved_warehouse=frappe.db.get_value("Stock Settings", "Stock Settings", "default_reservation_warehouse")
	doc=frappe.get_doc('Sales Order',unfreeze)
	stock_entry = frappe.db.get_value('Stock Entry', {'sales_order': unfreeze}, ["name"])
	stock=frappe.get_doc('Stock Entry', stock_entry)
	new_stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'stock_entry_type':'Unfreeze',
		'sales_order':stock.sales_order,
		'from_warehouse':reserved_warehouse,
		'to_warehouse':doc.set_warehouse
		})
	# for i in stock.items:
	# 	new_stock.append('items', {
	# 		"item_code": i.item_code,
	# 		"qty":i.qty,
	# 		"uom":i.uom,
	# 		"s_warehouse":i.t_warehouse,
	# 		"t_warehouse":i.s_warehouse,
	# 		"allow_zero_valuation_rate":1
	# 	})
	for item in unfreeze_items:
		new_stock.append('items', {
			"item_code": item.get('item_code'),
			"qty":item.get('quantity'),
			"s_warehouse":item.get('warehouse'),
			# "t_warehouse":stock.from_warehouse,
			"allow_zero_valuation_rate":1
		})
	new_stock.insert()
	new_stock.submit()
	# frappe.db.set_value('Sales Order', doc.name, 'is_frozen', 0)
	for item in unfreeze_items:
		for i in doc.items:
			r_quantity = i.reserved_quantity - float(item.get('quantity'))
			frappe.db.set_value("Sales Order Item", item.get('child_name'), "reserved_quantity", r_quantity)
