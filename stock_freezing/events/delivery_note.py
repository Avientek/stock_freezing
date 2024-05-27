import frappe


# def validate(self,method):
# 	if self.items:
# 		r_warehouse = frappe.db.get_value('Company', self.company, 'default_reservation_warehouse')
# 		for item in self.items:
# 			if item.item_code and item.reserved_quantity:
# 				if item.qty > item.reserved_quantity:
# 					frappe.throw("Quantity Exceeded")
# 				if item.reserved_quantity > 0:
# 					if r_warehouse:
# 						item.warehouse = r_warehouse
# 						# item.qty = item.reserved_quantity


# def validate(self,method):
# 	if self.items:
# 		r_warehouse = frappe.db.get_value('Warehouse', {"company":self.company}, 'custom_reservation_warehouse')
# 		print(r_warehouse,11111111)
# 		for item in self.items:
# 			if item.item_code and item.reserved_quantity:
# 				if item.qty > item.reserved_quantity:
# 					frappe.throw("Quantity Exceeded")
# 				if item.reserved_quantity > 0:
# 					if r_warehouse:
# 						item.warehouse = r_warehouse
# 						# item.qty = item.reserved_quantity
# 				if not item.reserved_quantity:
# 					if item.qty > self.total_qty - item.reserved_quantity:
# 						frappe.throw("hiiiiii")

def validate(self, method):
    if self.items:
        r_warehouse = frappe.db.get_value('Warehouse', {"company": self.company}, 'custom_reservation_warehouse')
        print(r_warehouse, 11111111)
        
        for item in self.items:
            if item.item_code:
                so_item = frappe.db.get_value('Sales Order Item', {'parent': item.against_sales_order, 'item_code': item.item_code}, 
                                              ['reserved_quantity', 'qty'], as_dict=True)
                if so_item:
                    reserved_qty = so_item.reserved_quantity or 0
                    total_qty = so_item.qty or 0
                    unreserved_qty = total_qty - reserved_qty

                    if item.reserved_quantity:  # This item is reserved
                        if item.qty > reserved_qty:
                            frappe.throw("Quantity Exceeded for Reserved Item: {}. Reserved Qty: {}, Delivered Qty: {}"
                                         .format(item.item_code, reserved_qty, item.qty))
                        if r_warehouse:
                            item.warehouse = r_warehouse
                    else:  # This item is unreserved
                        if item.qty > unreserved_qty:
                            frappe.throw("Quantity Exceeded for Unreserved Item: {}. Unreserved Qty: {}, Delivered Qty: {}"
                                         .format(item.item_code, unreserved_qty, item.qty))
                else:
                    frappe.throw("Sales Order item not found for Item: {}".format(item.item_code))
