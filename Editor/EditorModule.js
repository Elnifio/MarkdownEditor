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
        "estore": Editor,
        "value": String,
    },
    // data: function() {
    //     return {
    //         currentval: this.initval,
    //     }
    // }, 

    methods: {
        updator: function(event) {
            // console.log(event.target.value);
            this.$emit("value-update", event.target.value);
        },
        inputUpdate: function(event) {
            this.$emit("input-update", event);
        },
        select: function(event) {
            console.log(event);
        },
    },
    template: `
    <v-textarea @blur="updator($event)" @select="select($event)" :value="value" @input="inputUpdate($event)">
    </v-textarea>
    `
});

Vue.component("editor-control", {
    props: ['estore'],
    data: function() {
        return {
            editorstore: this.estore,
        }
    },
    computed: {
        ast: function() {
            return pobj.parse(this.editorstore.getCurrent());
        }
    },
    methods: { 
        store: function(event) {
            this.$emit("store-to-system");
        },
        update: function(event) {
            this.editorstore.setCurrent(event);
        },
        select: function(event) {
            console.log(event);
        }
    },
    template: `
    <v-row>
        <v-col cols=6>
            <editor 
                v-model="editorstore.getCurrent()" 
                @value-update="store($event)" 
                @input-update="update($event)"></editor>
        </v-col>
        <v-col cols=6>
            <markdown-block :ast="ast" v-if="ast"></markdown-block>
        </v-col>
    </v-row>
    `
})

/*
deleted content: 
<editor v-model="editorvalue" @input="update($event)"></editor>
            <v-textarea @input="update($event)" @select="select($event)" :value="evalue">
            </v-textarea>
*/