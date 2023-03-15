import frappe


def validate(self,method):
	if self.set_warehouse:
		for item in self.items:
			if item.item_code and item.reserved_quantity:
				if item.qty > item.reserved_quantity:
					frappe.msgprint("Quantity Exceeded")
				if item.reserved_quantity > 0:
					# frappe.model.add_row("Delivery Note Item", "items")
					r_warehouse = frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
					item.warehouse = r_warehouse
					item.qty = item.reserved_quantity
