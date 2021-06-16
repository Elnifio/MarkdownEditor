let Parser = require("../MarkdownCompiler/parser");
let Components = require("../MarkdownCompiler/Components")
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
    props: {
        initval: String
    },
    data: function() {
        return {
            editorvalue: this.initval,
        }
    },
    computed: {
        ast: function() {
            return pobj.parse(this.editorvalue);
        }
    },
    methods: { 
        update: function(event) {
            this.editorvalue = event;
            this.$emit("update", event);
        },
        select: function(event) {
            console.log(event);
        }
    },
    template: `
    <v-row>
        <v-col cols=6>
            <editor v-model="editorvalue" @input="update($event)"></editor>
        </v-col>
        <v-col cols=6>
        <markdown-block :ast="ast" v-if="ast"></markdown-block>
        </v-col>
    </v-row>
    `
})

/*
deleted content: 

            <v-textarea @input="update($event)" @select="select($event)" :value="evalue">
            </v-textarea>
*/