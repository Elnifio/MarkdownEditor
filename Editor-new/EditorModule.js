let Editor = function() {
    this.state = {
        currval: "",
    },

    this.setCurrent = function(newval) {
        this.state.currval = newval;
    }

    this.getCurrent = function() { return this.state.currval; }
}
exports.Editor = Editor;

Vue.component("editor", {
    props: {
        "initval": String,
    },
    data: function() {
        return {
            currentval: this.initval,
        }
    }, 

    methods: {
        updator: function(event) {
            this.$emit("editor-update", event.target.value);
        }
    },
    template: `
    <textarea @input="updator($event)">
    </textarea>
    `
});

Vue.component("editor-control", {
    props: ["editor"],
    data: function() {
        return {
            estore: this.editor,
        }
    },
    template: `
        
    `
})