const { TabInstance } = require("./TabInstance");

class TabManagerError {
    constructor(msg) {
        this.msg = msg;
        this.name = "TabManager Error";
    }

    toString() {
        return this.name + ": " + this.msg;
    }
}

let ZipTabManager = function(tm) {
    return JSON.stringify(tm.zipTabs());
}

let UnzipTabManager = function(givenString)  {
    let tm = new TabManager();
    tm.unzipTabs(JSON.parse(givenString));
    return tm;
}
exports.ZipTabManager = ZipTabManager;
exports.UnzipTabManager = UnzipTabManager;

class TabManager {
    constructor() {
        this.tabs = [];
    }

    createTab(newname="unnamed", color="#62C6F2FF", icon="mdi-tag") {
        let filterResult = this.tabs.filter(tab => tab.name == newname);
        let usename = newname;
        if (filterResult.length > 0) {
            let counter = 1;
            filterResult = this.tabs.filter(tab => tab.name == (newname + counter));
            while (filterResult.length > 0) {
                counter += 1;
                filterResult = this.tabs.filter(tab => tab.name == (newname + counter));
            }
            usename = newname + counter;
        }
        let out = new TabInstance(usename, [], icon, color);
        this.tabs.push(out);
        return out;
    }

    /**
     * 
     * @param {TabInstance} argtab 
     */
    changeTabName(argtab) {
        let usedname = argtab.name;
        let filterResult = this.tabs.filter(tab => tab.name == usedname && tab != argtab);
        if (filterResult.length > 0) {
            let counter = 1;
            filterResult = this.tabs.filter(tab => tab.name == (usedname+counter) && tab != argtab);
            while (filterResult.length > 0) {
                counter += 1;
                filterResult = this.tabs.filter(tab => tab.name == (usedname+counter) && tab != argtab);
            }
            argtab.name = usedname + counter;
        }
    }

    addTab(tab) {
        this.tabs.push(tab);
    }

    deleteTab(tab) {
        let idx = this.tabs.indexOf(tab);
        if (idx < 0) {
            throw new TabManagerError("Cannot find tab " + tab.name);
        } else {
            tab.selfDelete();
            this.tabs.splice(idx, 1);
        }
    }

    zipTabs() {
        return this.tabs.map(tab => tab.zip());
    }

    unzipTabs(zipped) {
        zipped.forEach(ziptab => {
            this.addTab(new TabInstance(ziptab[0], [], ziptab[1], ziptab[2], ziptab[3]));
        })
    }

    findTab(name) {
        let filterResult = this.tabs.filter(x => x.name == name);
        if (filterResult.length == 0) {
            console.log("creating new tab: " + name);
            return this.createTab(name);
        } else {
            if (filterResult.length > 1) { 
                console.log("Multiple tabs found: ");
                filterResult.forEach(x => console.log(x.zip()));
            }
            return filterResult[0];
        }
    }
}
exports.TabManager = TabManager;

Vue.component("tab-manager", {
    props: {"manager": TabManager},
    methods: {
        validateChange: function(tag) {
            this.manager.changeTabName(tag);
        },
        deleteTab: function(tab) {
            this.manager.deleteTab(tab);
        },
        propagateRelocation: function(node, newpath) {
            this.$emit("relocate-node", node, newpath);
        },
        propagateDeletion: function(node) {
            this.$emit("delete-node", node);
        },
        propagateClick: function(node) {
            this.$emit("click-node", node);
        },
    },
    template: `
    <v-sheet elevation="0">
        <tab-list-item 
            v-for="tab in manager.tabs"
            :givenTab="tab"
            :key="tab.name"
            @change-name="validateChange"
            @delete-tab="deleteTab"
            @relocate-node="propagateRelocation"
            @click-node="propagateClick"
            @delete-node="propagateDeletion"></tab-list-item>
    </v-sheet>
    `
})