from . import __version__ as app_version

app_name = "stock_freezing"
app_title = "Stock freezing"
app_publisher = "avientek.frappe.cloud"
app_description = "Stock freezing in Sales Order"
app_email = "avientek.frappe.cloud"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/stock_freezing/css/stock_freezing.css"
# app_include_js = "/assets/stock_freezing/js/stock_freezing.js"

# include js, css files in header of web template
# web_include_css = "/assets/stock_freezing/css/stock_freezing.css"
# web_include_js = "/assets/stock_freezing/js/stock_freezing.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "stock_freezing/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Sales Order": "public/js/sales_order.js",
	"Purchase Receipt": "public/js/purchase_receipt.js",
	"Delivery Note": "public/js/delivery_note.js",
	"Purchase Order": "public/js/purchase_order.js",
	"Purchase Invoice": "public/js/purchase_invoice.js",
	"Sales Invoice": "public/js/sales_invoice.js",
	"Stock Entry": "public/js/stock_entry.js",
    "Company": "public/js/company.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#	"methods": "stock_freezing.utils.jinja_methods",
#	"filters": "stock_freezing.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "stock_freezing.install.before_install"
# after_install = "stock_freezing.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "stock_freezing.uninstall.before_uninstall"
# after_uninstall = "stock_freezing.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "stock_freezing.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
#	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
#	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Delivery Note": {
		"validate":"stock_freezing.events.delivery_note.validate"
	},
	"Sales Order": {
		"validate":"stock_freezing.events.sales_order.validate"
	},
	"Purchase Receipt":{
		"validate":"stock_freezing.events.purchase_receipt.validate"
	},
	"Stock Entry": {
		# "on_cancel": "stock_freezing.events.stock_entry.on_cancel",
		"on_submit": "stock_freezing.events.stock_entry.on_submit"
	},
	# "Item": {
	# 	"validate": "avientek.events.item.validate_brand_pn"
	# }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
#	"all": [
#		"stock_freezing.tasks.all"
#	],
#	"daily": [
#		"stock_freezing.tasks.daily"
#	],
#	"hourly": [
#		"stock_freezing.tasks.hourly"
#	],
#	"weekly": [
#		"stock_freezing.tasks.weekly"
#	],
#	"monthly": [
#		"stock_freezing.tasks.monthly"
#	],
# }

# Testing
# -------

# before_tests = "stock_freezing.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#	"frappe.desk.doctype.event.event.get_events": "stock_freezing.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#	"Task": "stock_freezing.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

# user_data_fields = [
#	{
#		"doctype": "{doctype_1}",
#		"filter_by": "{filter_by}",
#		"redact_fields": ["{field_1}", "{field_2}"],
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_2}",
#		"filter_by": "{filter_by}",
#		"partial": 1,
#	},
#	{
#		"doctype": "{doctype_3}",
#		"strict": False,
#	},
#	{
#		"doctype": "{doctype_4}"
#	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#	"stock_freezing.auth.validate"
# ]
fixtures = [
	{
		"dt": "Custom Field",
		"filters": [
			["name", "in",
	  [
		'Purchase Receipt-is_frozen',
		'Delivery Note Item-actual_quantity',
        'Delivery Note Item-reserved_quantity',
        'Sales Order-is_frozen',
        'Sales Order Item-reserved_quantity',
		'Sales Order Item-actual_quantity',
        'Purchase Receipt-from_so',
		'Purchase Receipt Item-sales_order_item',
		'Purchase Receipt Item-sales_order',
        'Purchase Receipt Item-reserved_quantity',
		'Company-default_reservation_warehouse',
        'Stock Entry-sales_order',
        'Stock Entry-purchase_receipt',
		'Stock Entry-column_break_abtpd',
		'Stock Entry Detail-sales_order',
		'Stock Entry Detail-sales_order_item',
        'Stock Entry Detail-avientek_pr_item',
]
	  ]]
	},
	{"dt":"Property Setter",
		"filters": [["doc_type", "in", ("Purchase Order Item")]]
	  },
	{"dt":"Stock Entry Type",
	  "filters": [["name", "in", ["Freeze", "Unfreeze"]]]
	}
			]
