let Graph = function(directed=false) {
    this.in_edges = {};
    this.out_edges = {};
    this.directed = directed;
    this.renderWeight = false;

    this.insert_node = function(name) {
        if (!this.check_node(name)) {
            this.in_edges[name] = {};
            this.out_edges[name] = {};
        }
    }

    this.insert_edge = function(s, e, w) {
        if (this.check_node(s) && this.check_node(e)) {
            this.in_edges[e][s] = w;
            this.out_edges[s][e] = w;
        }
    }

    this.delete_edge = function(s,e) {
        if (this.check_node(s) && this.check_node(e)) {
            delete this.in_edges[e][s];
            delete this.out_edges[s][e];
        }
    }
    
    this.delete_node = function(node) {
        if (this.check_node(node)) {
            for (let s in this.in_edges[node]) {
                delete this.out_edges[s][node];
            }
            for (let e in this.out_edges[node]) {
                delete this.in_edges[e][node];
            }
            delete this.in_edges[node];
            delete this.out_edges[node];
        }
    }

    this.check_node = function(node) {
        return (this.in_edges[node] && this.out_edges[node]);
    }

    this.check_edge = function(s,e) {
        if (this.check_node(s) && this.check_node(e)) {
            return (this.in_edges[s][e] && this.out_edges[s][e]);
        } else {
            return false;
        }
    }

    this.get_all_nodes = function() {
        return Object.keys(this.in_edges);
    }

    this.get_connect = function(node) {
        if (this.check_node) {
            return this.out_edges[node];
        }
    }
}

export default Graph;