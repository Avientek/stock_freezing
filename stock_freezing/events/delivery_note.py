import frappe


def validate(self,method):
	if self.items:
		r_warehouse = frappe.db.get_value('Company', self.company, 'default_reservation_warehouse')
		for item in self.items:
			if item.item_code and item.reserved_quantity:
				if item.qty > item.reserved_quantity:
					frappe.msgprint("Quantity Exceeded")
				if item.reserved_quantity > 0:
					if r_warehouse:
						item.warehouse = r_warehouse
						# item.qty = item.reserved_quantity
