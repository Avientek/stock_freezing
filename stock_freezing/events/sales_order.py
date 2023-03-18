import frappe
import json


def validate(self,method):
	for i in self.items:
		if i.qty:
			i.actual_quantity = i.qty


@frappe.whitelist()
def create_stock_entry(freeze, company, dialog_items):
	reserved=json.loads(dialog_items)
	reserved_warehouse = frappe.db.get_value('Company', company, 'default_reservation_warehouse')
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
		"amount":amount,
		"sales_order":freeze,
		"sales_order_item":item.get('child_name')
		})
	stock.insert()
	stock.submit()
	for item in item_details:
		for i in doc.items:
			if not i.qty <  i.reserved_quantity + float(item.get('quantity')):
				r_quantity = i.reserved_quantity + float(item.get('quantity'))
				frappe.db.set_value('Sales Order Item', item.get('child_name'), 'reserved_quantity', r_quantity)
	frappe.db.set_value('Sales Order', doc.name, 'is_frozen', 1)



@frappe.whitelist()
def unfreeze_sales_order(unfreeze, company, dialog_items):
	unfreeze_dict = json.loads(dialog_items)
	unfreeze_items = unfreeze_dict['items']
	reserved_warehouse=frappe.db.get_value('Company', company, 'default_reservation_warehouse')
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
	for item in unfreeze_items:
		new_stock.append('items', {
			"item_code": item.get('item_code'),
			"qty":item.get('quantity'),
			"s_warehouse":item.get('warehouse'),
			# "t_warehouse":stock.from_warehouse,
			"allow_zero_valuation_rate":1,
			"sales_order":unfreeze,
			"sales_order_item":item.get('child_name')
		})
	new_stock.insert()
	new_stock.submit()
	# frappe.db.set_value('Sales Order', doc.name, 'is_frozen', 0)
	for item in unfreeze_items:
		for i in doc.items:
			if not i.qty <  i.reserved_quantity - float(item.get('quantity')):
				r_quantity = i.reserved_quantity - float(item.get('quantity'))
				frappe.db.set_value("Sales Order Item", item.get('child_name'), "reserved_quantity", r_quantity)



@frappe.whitelist()
def get_sales_order_items(customer,items,company):
	item_list=json.loads(items)
	item_list_1  = []
	for i in item_list:
		item_code = i.get('item_code')
		item_list_1.append(i.get('item_code'))
	item_list_new = [frappe.db.escape(i) for i in item_list_1]
	item_list_new = ", ".join(item_list_new)
	# print(item_list_new)
	query = f'''
		SELECT
			so.name as name,
			sot.item_code as item_code,
			sot.qty-sot.reserved_quantity as reserved_quantity,
			sot.name as child_name,
			sot.warehouse as warehouse

		FROM
			`tabSales Order` AS so LEFT JOIN
			`tabSales Order Item` AS sot ON
			sot.parent = so.name

		WHERE
			so.docstatus=1 AND so.customer = "{customer}" AND
			so.company = "{company}" AND sot.item_code in ({item_list_new}) AND
			sot.qty - sot.delivered_qty - reserved_quantity > 0
	'''
	data = frappe.db.sql(f"{query}", as_dict=True)
	return data