let Tree = function(root=0) {
    this.root = new Node(root, []);
    this.current = this.root;

    this.addElement = function(node) {
        this.current.add_element(node);
    }

    this.deleteElement = function(value) {
        this.current.delete_element(value);
    }

    this.moveCursor = function(value) {
        let next = this.current.find_element(value);
        if (next != undefined) {
            this.current = next;
        }
    }

    this.findCurrentChildren = function() {
        return this.current.find_children();
    }

    this.resetCursor = function() {
        this.current = this.root;
    }
}

let Node = function(inputValue=0, next=[]) {
    this.value = inputValue;
    this.next = next;

    this.add_element = function(node) {
        let out = new Node(node, []);
        this.next.push(out);
        return out;
    }
    
    this.delete_element = function(value) {
        this.next = this.next.map(x => {
            if (x.value == value) {
                return;
            } else {
                return x;
            }
        })
    }

    this.find_element = function(value) {
        for (let i = 0; i < this.next.length; i++){
            if (this.next[i].value == value) {
                return this.next[i];
            }
        }
        return undefined;
    }

    this.find_children = function() {
        return this.next;
    }
}

export default Tree;