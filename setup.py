from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in stock_freezing/__init__.py
from stock_freezing import __version__ as version

setup(
	name="stock_freezing",
	version=version,
	description="Stock freezing in Sales Order",
	author="avientek.frappe.cloud",
	author_email="avientek.frappe.cloud",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
