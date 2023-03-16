import frappe
import json


def validate(self,method):
	for i in self.items:
		if i.sales_order:
			self.from_so = 1


@frappe.whitelist()
def get_purchase_stock_entry(freeze,dialog_items):
	reserved=json.loads(dialog_items)
	customer=reserved['customer']
	reserved_warehouse=frappe.db.get_value("Stock Settings", "Stock Settings", "default_reservation_warehouse")
	item_details=reserved.get('items')
	doc=frappe.get_doc('Purchase Receipt',freeze)
	stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'from_warehouse':doc.set_warehouse,
		'to_warehouse':reserved_warehouse,
		'stock_entry_type':'Freeze',
		'purchase_receipt':doc.name
	})
	for item in item_details:
		item_code=item.get('item_code')
		quantity=item.get('quantity')
		stock.append('items', {
		"item_code": item_code,
		"qty":quantity,
		"conversion_factor":1,
		"t_warehouse":reserved_warehouse,
		"allow_zero_valuation_rate":1,
		})
	stock.insert()
	stock.submit()
	for item in item_details:
		reserved_qty = frappe.db.get_value('Sales Order Item', item.get('child_name'), 'reserved_quantity')
		set_qty = reserved_qty + float(item.get('quantity'))
		frappe.db.set_value('Sales Order Item', item.get('child_name'), 'reserved_quantity', set_qty)
	frappe.db.set_value('Purchase Receipt', doc.name, 'is_frozen', 1)



@frappe.whitelist()
def set_reserved_quantity(freeze,dialog_items):
	reserved=json.loads(dialog_items)
	reserved_warehouse=frappe.db.get_value("Stock Settings", "Stock Settings", "default_reservation_warehouse")
	item_details=reserved['items']
	doc=frappe.get_doc('Purchase Receipt',freeze)
	stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'from_warehouse':doc.set_warehouse,
		'to_warehouse':reserved_warehouse,
		'stock_entry_type':'Freeze',
		'purchase_receipt':doc.name
	})
	for item in item_details:
		item_code=item.get('item_code')
		rate=item.get('rate')
		amount=item.get('amount')
		quantity=item.get('quantity')
		stock.append('items', {
		"item_code": item_code,
		"qty":quantity,
		"conversion_factor":1,
		"t_warehouse":reserved_warehouse,
		"allow_zero_valuation_rate":1,
		"basic_rate":rate,
		"amount":amount
		})
	stock.insert()
	stock.submit()
	for item in item_details:
		for i in doc.items:
			if item.get('item_code') == i.item_code:
				r_quantity = i.reserved_quantity + float(item.get('quantity'))
				frappe.db.set_value('Purchase Receipt Item', item.get('child_name'), 'reserved_quantity', r_quantity)
				frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', r_quantity)
	frappe.db.set_value('Purchase Receipt', doc.name, 'is_frozen', 1)


# @frappe.whitelist()
# def	unfreeze_purchase_receipt(unfreeze, dialog_items):
# 	unfreeze_dict = json.loads(dialog_items)
# 	unfreeze_items = unfreeze_dict['items']
# 	reserved_warehouse=frappe.db.get_value("Stock Settings", "Stock Settings", "default_reservation_warehouse")
# 	doc=frappe.get_doc('Purchase Receipt',unfreeze)
# 	stock_entry = frappe.db.get_value('Stock Entry', {'purchase_receipt': unfreeze}, ["name"])
# 	stock=frappe.get_doc('Stock Entry', stock_entry)
# 	new_stock=frappe.get_doc({
# 		'doctype': 'Stock Entry',
# 		'stock_entry_type':'Unfreeze',
# 		'purchase_receipt':doc.name,
# 		'from_warehouse':reserved_warehouse,
# 		'to_warehouse':doc.set_warehouse
# 		})

# 	for item in unfreeze_items:
# 		new_stock.append('items', {
# 			"item_code": item.get('item_code'),
# 			"qty":item.get('quantity'),
# 			"s_warehouse":item.get('warehouse'),
# 			"allow_zero_valuation_rate":1
# 		})

# 	new_stock.insert()
# 	new_stock.submit()
# 	for item in unfreeze_items:
# 		for i in doc.items:
# 			if item.get('item_code') == i.item_code:
# 				r_quantity = i.reserved_quantity - float(item.get('quantity'))
# 				frappe.db.set_value('Purchase Receipt Item', item.get('child_name'), 'reserved_quantity', r_quantity)
# 				frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', r_quantity)

