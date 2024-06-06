import frappe
from stock_freezing.stock_freezing.doctype.frozen_stock.frozen_stock import get_frozen_stock,get_frozen_qty
from frappe.utils import flt
from frappe import _

def on_submit(self, method):
	for item in self.items:
		if item.sales_order_item:
			so_item_dict = frappe.db.get_value("Sales Order Item", item.sales_order_item, ['reserved_quantity', 'qty'], as_dict=1)
			if self.stock_entry_type == "Freeze":
				if float(so_item_dict.reserved_quantity) + float(item.qty) <= so_item_dict.qty:
					frappe.db.set_value("Sales Order Item", item.sales_order_item, "reserved_quantity", float(so_item_dict.reserved_quantity) + float(item.qty))
			elif self.stock_entry_type == "Unfreeze":
				if float(so_item_dict.qty) >= float(so_item_dict.reserved_quantity) - float(item.get('qty')):
					set_qty = 0
					if float(so_item_dict.reserved_quantity) - float(item.get('qty')) >= 0:
						set_qty = float(so_item_dict.reserved_quantity) - float(item.get('qty'))
					frappe.db.set_value("Sales Order Item", item.sales_order_item, "reserved_quantity", set_qty)
			if item.avientek_pr_item:
				pr_item_dict = frappe.db.get_value("Purchase Receipt Item", item.avientek_pr_item, ['reserved_quantity', 'qty'], as_dict=1)
				if float(pr_item_dict.reserved_quantity) + float(item.qty) <= pr_item_dict.qty:
					frappe.db.set_value("Purchase Receipt Item", item.avientek_pr_item, "reserved_quantity", float(pr_item_dict.reserved_quantity) + float(item.qty))


def on_cancel(self, method):
	if self.stock_entry_type in ["Freeze", "Unfreeze"]:
		frappe.throw("You can not cancel freeze/unfreeze entries. \nKindly go to sales order and use Reserve button")