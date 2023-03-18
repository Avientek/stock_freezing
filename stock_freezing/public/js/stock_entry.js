frappe.ui.form.on('Stock Entry', {
	onload_post_render:function(frm){
		if(!frm.doc.sales_order && !frm.doc.purchase_receipt){
		// frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
		// .then(default_reservation_warehouse => {
		frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
			.then(r => {
			if(r.message.default_reservation_warehouse){
			frm.set_query('from_warehouse', function(doc) {
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}
			  })
			frm.set_query('to_warehouse', function(doc) {
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}
			  })
			  frm.set_query('s_warehouse', 'items', function(doc,cdt,cdn){
				let row = locals[cdt][cdn];
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}}
			  )
			  frm.set_query('t_warehouse', 'items', function(doc,cdt,cdn){
				let row = locals[cdt][cdn];
				return {
				  "filters": [
					['company', '=', frm.doc.company],
					['name', '!=', r.message.default_reservation_warehouse],
					['is_group', '=', 'No']
				  ]
				}}
			  )
		}})
		}
	}
	})
