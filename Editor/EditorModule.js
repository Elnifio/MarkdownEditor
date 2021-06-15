let Parser = require("../MarkdownCompiler/parser");
let pobj = new Parser.Parser();

let Editor = function() {
    this.state = {
        currval: "", 
    };

    this.setCurrent = function(newval) {
        this.state.currval = newval;
    };

    this.getCurrent = function() { return this.state.currval; };
}
exports.Editor = Editor;

Vue.component("editor", {
    props: {
        "value": String,
    },
    // data: function() {
    //     return {
    //         currentval: this.initval,
    //     }
    // }, 

    methods: {
        updator: function(event) {
            this.$emit("input", event);
        },
        select: function(event) {
            console.log(event);
        }
    },
    template: `
    <v-textarea @input="updator($event)" @select="select($event)" :value="value">
    </v-textarea>
    `
});

Vue.component("editor-control", {
    props: ["editor"],
    data: function() {
        return {
            estore: this.editor,
        }
    },
    computed: {
        ast: function() {
            return pobj.parse(this.estore.getCurrent());
        }
    },
    methods: {
        // reparse: function(newvalue) {
        //     this.ast = pobj.parse(newvalue);
        // }
    },
    template: `
    <v-row>
        <v-col cols=6>
        <editor v-model="estore.state.currval"></editor>
        </v-col>
        <v-col cols=6>
        <markdown-block :ast="ast" v-if="ast"></markdown-block>
        </v-col>
    </v-row>
    `
})