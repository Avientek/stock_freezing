frappe.ui.form.on('Company',{
    refresh: function(frm) {
        frm.set_query('default_reservation_warehouse', function(doc) {
            return {
              "filters": [
                ['company', '=', frm.doc.name],
              ]
            }
          })
    }
})