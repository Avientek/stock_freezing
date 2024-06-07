# Copyright (c) 2024, avientek.frappe.cloud and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt

class FrozenStock(Document):
	def update_frozen_stock(self,qty):
		self.db_set("quantity",flt(self.quantity or 0)+flt(qty),update_modified=True)
		if self.quantity == 0:
			self.delete()

def get_frozen_stock(item_code, from_warehouse,warehouse, sales_order, sales_order_item):
	fs = frappe.db.get_value("Frozen Stock", {"item_code": item_code, "warehouse": warehouse, 'from_warehouse':from_warehouse, 'sales_order': sales_order, 'sales_order_item':sales_order_item})
	if not fs:
		fs_obj = frappe.get_doc(doctype="Frozen Stock", item_code=item_code, from_warehouse=from_warehouse,warehouse=warehouse,sales_order=sales_order,sales_order_item=sales_order_item,created_on=frappe.utils.today())
		fs_obj.flags.ignore_permissions = 1
		fs_obj.insert()
	else:
		fs_obj = frappe.get_doc("Frozen Stock", fs)
	fs_obj.flags.ignore_permissions = True
	return fs_obj

def get_frozen_qty(item_code, warehouse, sales_order, sales_order_item):
	frozen_qty = frappe.db.sql(
		"""select quantity from `tabFrozen Stock`
		where item_code = %s and warehouse = %s and sales_order = %s and sales_order_item = %s
		limit 1""",
		(item_code, warehouse, sales_order,sales_order_item),
		as_dict=1,
	)

	return frozen_qty[0].quantity or 0 if frozen_qty else 0


