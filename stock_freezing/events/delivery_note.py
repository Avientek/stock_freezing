import frappe
from stock_freezing.stock_freezing.doctype.frozen_stock.frozen_stock import get_frozen_stock,get_frozen_qty

def validate(self, method):
    if self.items:
        for item in self.items:
            if item.custom_frozen_stock:
                fs = frappe.get_doc("Frozen Stock",item.custom_frozen_stock)
                if item.qty > fs.quantity:
                    frappe.throw("Quantity Exceeded for Reserved Item: {}. Reserved Qty: {}".format(item.item_code, fs.quantity))
            else:
                frozen_qty = get_frozen_qty(item.item_code,item.warehouse,item.against_sales_order)
                so_item = frappe.db.get_value('Sales Order Item', {'parent': item.against_sales_order, 'item_code': item.item_code}, 
                                              ['delivered_qty','qty'], as_dict=True)
                if so_item:
                    if item.qty  > (so_item.qty - so_item.delivered_qty - frozen_qty):
                                frappe.throw("Quantity Exceeded for Unreserved Item: {}. Unreserved Qty: {}"
                                             .format(item.item_code, (so_item.qty - so_item.delivered_qty - frozen_qty)))

def update_frozen_stock(self, method):
    if self.docstatus ==1 and self.items:
        for item in self.items:
            if item.custom_frozen_stock:
                fs = frappe.get_doc("Frozen Stock",item.custom_frozen_stock)
                fs.update_frozen_stock(0-item.qty)

    elif self.docstatus ==2 and self.items:
        for item in self.items:
            if item.custom_frozen_stock:
                from_warehouse = frappe.db.get_value("Warehouse",{'custom_is_reservation_warehouse':1,'custom_reservation_warehouse':item.warehouse},['name'])
                fs = get_frozen_stock(item.item_code,from_warehouse,item.warehouse,item.against_sales_order)
                item.custom_frozen_stock = fs.name
                fs.update_frozen_stock(item.qty)
