import frappe


def on_cancel(self, method):
	if self.stock_entry_type == "Freeze":
		if self.items:
			for i in self.items:
				if i.sales_order_item and i.sales_order:
					reserved_qty = frappe.db.get_value('Sales Order Item', i.sales_order_item, 'reserved_quantity')
					if reserved_qty:
						update_reserved_qty = i.qty - reserved_qty
						frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', update_reserved_qty)
	
	if self.stock_entry_type == "Unfreeze":
		if self.items:
			for i in self.items:
				if i.sales_order_item and i.sales_order:
					reserved_qty = frappe.db.get_value('Sales Order Item', i.sales_order_item, 'reserved_quantity')
					if reserved_qty >= 0:
						update_reserved_qty = i.qty + reserved_qty
						frappe.db.set_value('Sales Order Item', i.sales_order_item, 'reserved_quantity', update_reserved_qty)

