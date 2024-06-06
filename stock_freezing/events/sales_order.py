import frappe
import json
from frappe.utils import flt
from stock_freezing.stock_freezing.doctype.frozen_stock.frozen_stock import get_frozen_stock,get_frozen_qty


def validate(self,method):
	for i in self.items:
		if i.qty:
			i.actual_quantity = i.qty

@frappe.whitelist()
def freeze_unfreeze(docname, doctype,stock_entry_type, dialog_items):
	doc=frappe.get_doc(doctype, docname)
	d_data=json.loads(dialog_items)
	item_details=d_data["items"]
	stock=frappe.get_doc({
		"doctype": "Stock Entry",
		"company":doc.company,
		"stock_entry_type":stock_entry_type,
		"sales_order":docname
	})
	for item in item_details:
		stock.append("items", {
			"item_code": item.get("item_code"),
			"qty":item.get("quantity"),
			"conversion_factor":1,
			"t_warehouse":item.get("to_warehouse"),
			"allow_zero_valuation_rate":1,
			"basic_rate":item.get("rate"),
			"s_warehouse":item.get("warehouse"),
			"amount":item.get("amount"),
			"sales_order":docname,
			"sales_order_item":item.get("child_name")
		})

	stock.insert().submit()

	if frappe.db.exists("Stock Entry",stock.name):
		for item in item_details:
			if stock_entry_type == "Freeze":
				fs = get_frozen_stock(item.get("item_code"),item.get("warehouse"),item.get("to_warehouse"),doc.name)
				fs.update_frozen_stock(item.get("quantity"))
			else:
				fs = get_frozen_stock(item.get("item_code"),item.get("to_warehouse"),item.get("warehouse"),doc.name)
				fs.update_frozen_stock(0-flt(item.get("quantity")))

@frappe.whitelist()
def get_so_frozen_data(docname):
    frozen_stocks = frappe.get_all("Frozen Stock", {"sales_order": docname},['item_code','warehouse','from_warehouse','quantity'])
    return frozen_stocks

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
