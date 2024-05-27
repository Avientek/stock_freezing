frappe.ui.form.on("Warehouse", {
    refresh: function(frm){
        frm.set_query("custom_reservation_warehouse", function(){
            return{
                filters : {
                    "parent_warehouse" : frm.doc.parent_warehouse,
                    "is_group" : 0,
                   
                }
            }
        })
    }
})