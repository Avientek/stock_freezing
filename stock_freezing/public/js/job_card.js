frappe.ui.form.on("Job Card", {
    onload: function(frm){
        frm.set_query("wip_warehouse", function(){
            return {
                "filters":[
                    ["company","=",frm.doc.company],
                    ["custom_is_reserved_warehouse","=",0],
                    ["is_group","=",0]
                ]
            }
        })

        frm.set_query("source_warehouse","items", function(){
            
            return {
                "filters":[
                    ["company","=",frm.doc.company],
                    ["custom_is_reserved_warehouse","=",0],
                    ["is_group","=",0]
                ]
            }
        })
    }
})