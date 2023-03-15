frappe.ui.form.on('Purchase Invoice', {
	onload:function(frm){
		frappe.db.get_single_value('Stock Settings', 'default_reservation_warehouse')
		.then(default_reservation_warehouse => {
			frm.set_query('set_warehouse', function(doc) {
				return {
				  "filters": [
				  
					['company', '=', frm.doc.company],
					['name', '!=', default_reservation_warehouse],
					['is_group', '=', 'No']
					

				  ]
			
				}
				
			  })
			  frm.set_query('warehouse', 'items', function(doc,cdt,cdn) {
				let row = locals[cdt][cdn];
				return {
				  "filters": [
				  
					['company', '=', frm.doc.company],
					['name', '!=', default_reservation_warehouse],
					['is_group', '=', 'No']

				  ]
			
				}}
			  )
			})
        }
    })