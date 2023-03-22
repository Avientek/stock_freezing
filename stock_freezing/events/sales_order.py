import frappe
import json


def validate(self,method):
	for i in self.items:
		if i.qty:
			i.actual_quantity = i.qty


@frappe.whitelist()
def freeze(docname, doctype, dialog_items):
	doc=frappe.get_doc(doctype, docname)
	d_data=json.loads(dialog_items)
	reserve_warehouse = frappe.db.get_value("Company", doc.company, "default_reservation_warehouse")
	item_details=d_data["items"]
	stock=frappe.get_doc({
		"doctype": "Stock Entry",
		"from_warehouse": doc.set_warehouse,
		"to_warehouse":reserve_warehouse,
		"stock_entry_type":"Freeze",
		"sales_order":docname
	})
	for item in item_details:
		stock.append("items", {
			"item_code": item.get("item_code"),
			"qty":item.get("quantity"),
			"conversion_factor":1,
			"t_warehouse":reserve_warehouse,
			"allow_zero_valuation_rate":1,
			"basic_rate":item.get("rate"),
			"s_warehouse":item.get("warehouse"),
			"amount":item.get("amount"),
			"sales_order":docname,
			"sales_order_item":item.get("child_name")
		})
	stock.insert().submit()


@frappe.whitelist()
def unfreeze(docname, doctype, dialog_items):
	doc=frappe.get_doc(doctype, docname)
	unfreeze_dict = json.loads(dialog_items)
	unfreeze_items = unfreeze_dict['items']
	reserve_warehouse=frappe.db.get_value('Company', doc.company, 'default_reservation_warehouse')
	new_stock=frappe.get_doc({
		'doctype': 'Stock Entry',
		'stock_entry_type':'Unfreeze',
		'sales_order':docname,
		'from_warehouse':reserve_warehouse,
		'to_warehouse':doc.set_warehouse
		})
	for item in unfreeze_items:
		new_stock.append('items', {
			"item_code": item.get('item_code'),
			"qty":item.get('quantity'),
			"s_warehouse":item.get('warehouse'),
			"t_warehouse": frappe.db.get_value('Sales Order Item', {'name': item.get('child_name')}, ["warehouse"]),
			"allow_zero_valuation_rate":1,
			"sales_order":docname,
			"sales_order_item":item.get('child_name')
		})
	new_stock.insert().submit()


@frappe.whitelist()
def get_sales_order_items(customer, items, company):
	item_list=json.loads(items)
	item_list_1  = []
	for i in item_list:
		item_code = i.get('item_code')
		item_list_1.append(i.get('item_code'))
	item_list_new = [frappe.db.escape(i) for i in item_list_1]
	item_list_new = ", ".join(item_list_new)
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

@frappe.whitelist()
def get_sales_order_items(items, company, customer=None):
	item_list=json.loads(items)
	item_list_1  = []
	for i in item_list:
		item_code = i.get('item_code')
		item_list_1.append(i.get('item_code'))
	item_list_new = [frappe.db.escape(i) for i in item_list_1]
	item_list_new = ", ".join(item_list_new)
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
			so.docstatus=1 AND
			so.company = "{company}" AND sot.item_code in ({item_list_new}) AND
			sot.qty - sot.delivered_qty - reserved_quantity > 0
	'''
	if customer:
		query += f'''AND so.customer = "{customer}"'''
	data = frappe.db.sql(f"{query}", as_dict=True)
	return data
