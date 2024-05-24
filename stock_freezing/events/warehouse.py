# import frappe

# @frappe.whitelist()
# def get_filtered_warehouses(company):
#     warehouses = frappe.get_all("Warehouse", filters={"custom_is_reserved_warehouse": 0,"company":company},pluck="name")
#     return warehouses