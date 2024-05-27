frappe.ui.form.on('Sales Invoice', {
	onload_post_render:function(frm){
	// 	frappe.db.get_value('Company', frm.doc.company, 'default_reservation_warehouse')
	// 	.then(r => {
	// 	if(r.message.default_reservation_warehouse){
	// 		frm.set_query('set_warehouse', function(doc) {
	// 			return {
	// 			  "filters": [
				  
	// 				['company', '=', frm.doc.company],
	// 				['name', '!=', r.message.default_reservation_warehouse],
	// 				['is_group', '=', 'No']
					

	// 			  ]
			
	// 			}
				
	// 		  })
	// 		  frm.set_query('warehouse', 'items', function(doc,cdt,cdn) {
	// 			let row = locals[cdt][cdn];
	// 			return {
	// 			  "filters": [
				  
	// 				['company', '=', frm.doc.company],
	// 				['name', '!=', r.message.default_reservation_warehouse],
	// 				['is_group', '=', 'No']

	// 			  ]
			
	// 			}}
	// 		  )
	// }})

		frm.set_query('set_warehouse', function () {
			return {
				"filters": [
					['company', '=', frm.doc.company],
					['custom_is_reserved_warehouse', '=', 0],
					['is_group', '=', 0]
				]
			}
		})
		frm.set_query('warehouse','items',function(doc,cdt,cdn){
			let row = locals[cdt][cdn]
			return {
				"filters": [
					['company', '=', frm.doc.company],
					['custom_is_reserved_warehouse', '=', 0],
					['is_group', '=', 0]
				]
			}
		})
        },
    })