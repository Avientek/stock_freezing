frappe.ui.form.on("Work Order",{
    onload: function(frm){
        frm.set_query("source_warehouse","required_items",function(doc,cdt,cdn){
            let row = locals[cdt][cdn]
            return {
                "filters": [
                    ["company","=",frm.doc.company],
                    ["custom_is_reserved_warehouse","=",0],
                    ["is_group","=",0]
                ]
            }
        })
    }
})