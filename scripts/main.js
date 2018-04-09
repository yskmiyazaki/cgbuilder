class Bead {
	constructor () {
		this._name = null;
		this.atoms = [];
	}

	indexOf(atom) {
	    if (this.atoms.length > 0) {
            for (var i=0; i < this.atoms.length; i++) {
                if (this.atoms[i].index == atom.index) {
                    return i;
                }
            }
        }
		return -1;
	}

	addAtom(atom) {
		if (!this.isAtomIn(atom)) {
			this.atoms.push(atom);
		}
	}

	removeAtom(atom) {
	    var atomIndex = this.indexOf(atom);
	    if (atomIndex >= 0) {
	        this.atoms.splice(atomIndex, 1);
	    }
	}

	toggleAtom(atom) {
	    if (this.isAtomIn(atom)) {
	        this.removeAtom(atom);
	    } else {
	        this.addAtom(atom);
	    }
	}

	set name(name) {
		this._name = name;
	}

	get name() {
		return this._name;
	}

	isAtomIn(atom) {
		return this.indexOf(atom) >= 0;
	}
}


class BeadCollection {
    constructor () {
        this._beads = [];
        this._current = null;
        this._largestIndex = -1;
        this.newBead();
    }

    newBead () {
        var bead = new Bead();
        this._largestIndex += 1;
        bead.name = 'BEAD' + this._largestIndex;
        this._beads.push(bead);
        this._current = bead;
        return bead;
    }

    removeBead(index) {
        this._beads.splice(index, 1);
    }

    get currentBead() {
        return this._current;
    }

    get beads() {
        return this._beads;
    }

    selectBead(index) {
        this._current = this._beads[index];
    }
}


class Vizualization {
    constructor(collection) {
        this.collection = collection;
        this.representation = null;
    }

	get currentBead() {
	    return this.collection.currentBead;
	}

    attachRepresentation(component) {
        this.representation = component.addRepresentation(
	        "ball+stick",
	        {
	            sele: "not all",
	            radiusScale: 1.5,
	            color: "#f4b642",
	            opacity: 0.5
	        },
	    );
    }

    onClick(pickingProxy) {
    	// pickingProxy is only defined if the click is on an atom.
    	//We do not want to do anything if tere is no atom selected.
    	if (pickingProxy && pickingProxy.atom) {
			this.currentBead.toggleAtom(pickingProxy.atom);
            this.updateSelection();
		}
	}

	onNewBead(event) {
	    this.collection.newBead();
	    this.updateSelection();
	}

	onBeadSelected(event) {
	    var realTarget = findParentWithClass(event.target, "bead-view");
        var nodes = document.getElementById("bead-list").childNodes;
        var index = 0;
        var child;
        for (child of nodes) {
            if (child === realTarget) {
                this.collection.selectBead(index);
            }
            index += 1;
        }
        this.updateSelection();
	}

	onBeadRemove(event) {
        var realTarget = findParentWithClass(event.target, "bead-view");
        var nodes = document.getElementById("bead-list").childNodes;
        var index = 0;
        var child;
        var selected = -1;
        for (child of nodes) {
            if (child === realTarget) {
                selected = index;
                break;
            }
            index += 1;
        }
        if (selected >= 0) {
            this.collection.removeBead(selected);
        }
        this.updateSelection();
    }


	selectionString(bead) {
        if (bead.atoms.length > 0) {
            var sel = "@";
            for (var i=0; i < bead.atoms.length; i++) {
                if (sel != '@') {
                    sel = sel + ',';
                }
                sel = sel + bead.atoms[i].index;
            }
            return sel;
        }
        return "not all";
    }

    updateSelection() {
        var selString = this.selectionString(this.currentBead);
        this.representation.setSelection(selString);
        this.clearBeadList();
        this.createBeadList();
        this.updateNDX();
        this.updateMap();
    }

    createBeadListItem(bead) {
        var textNode;
        var list = document.getElementById("bead-list");
        var item = document.createElement("li");

        var removeNode = document.createElement("button");
        textNode = document.createTextNode("X");
        removeNode.appendChild(textNode);
        removeNode.onclick = (event) => this.onBeadRemove(event);
        item.appendChild(removeNode);

        var nameNode = document.createElement("p");
        var textNode = document.createTextNode(bead.name);
        nameNode.appendChild(textNode);
        var nameList = document.createElement("ul");
        var subitem;
        if (bead.atoms.length > 0) {
            for (var i=0; i < bead.atoms.length; i++) {
                subitem = document.createElement("li");
                textNode = document.createTextNode(bead.atoms[i].atomname);
                subitem.appendChild(textNode);
                nameList.appendChild(subitem);
            }
        }
        item.appendChild(nameNode);
        item.appendChild(nameList);
        item.onclick = (event) => this.onBeadSelected(event);
        item.classList.add("bead-view");
        if (bead === this.currentBead) {
            item.classList.add("selected-bead");
        }
        list.appendChild(item);
    }

    createBeadList() {
        for (var bead of this.collection.beads) {
            this.createBeadListItem(bead);
        }
    }

    clearBeadList() {
        var list = document.getElementById('bead-list');
        while (list.lastChild) {
            list.removeChild(list.lastChild);
        }
    }

    updateNDX() {
        var displayNode = document.getElementById('ndx-output');
        displayNode.textContent = generateNDX(this.collection);
    }

    updateMap() {
        var displayNode = document.getElementById('map-output');
        displayNode.textContent = generateMap(this.collection);
    }
}


function findParentWithClass(element, className) {
    var node = element;
    while (node) {
        if (node.classList.contains(className)) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}


function generateNDX(collection) {
    var ndx = "";
    for (bead of collection.beads) {
        ndx += "[ " + bead.name + " ]\n";
        for (atom of bead.atoms) {
            ndx += (atom.index + 1) + " ";
        }
        ndx += "\n\n";
    }
    return ndx;
}


function generateMap(collection) {
    var output = "[ to ]\nmartini\n\n[ martini ]\n";
    var atomToBeads = {};
    var atoms = [];
    var atomname;
    var index;
    for (bead of collection.beads) {
        output += bead.name + " ";
        for (atom of bead.atoms) {
            atomname = atom.atomname;
            if (!atomToBeads[atomname]) {
                atomToBeads[atomname] = [];
                atoms.push(atom);
            }
            atomToBeads[atomname].push(bead.name);
        }
    }
    output += "\n\n";

    output += "[ atoms ]\n";
    index = 0;
    atoms.sort(function(a, b) {return a.index - b.index});
    for (atom of atoms) {
        index += 1;
        output += index + "\t" + atom.atomname;
        for (bead of atomToBeads[atom.atomname]) {
            output += "\t" + bead;
        }
        output += "\n";
    }

    return output;
}


function main() {
    collection = new BeadCollection();
    //var collection = new BeadCollection();
    var vizu = new Vizualization(collection);

    // Create NGL Stage object
    var stage = new NGL.Stage( "viewport" );

    // Handle window resizing
    window.addEventListener( "resize", function( event ){
        stage.handleResize();
    }, false );

    // Load PDB
	stage.loadFile("data/benzene_atb.pdb").then(function (component) {
	    component.addRepresentation("ball+stick");
	    vizu.attachRepresentation(component);
	});
	
	// Remove preset action on atom pick.
	// As of NGL v2.0.0-dev.11, the left click atom pick is binded to the
	// centering of the view on the selected atom. In previous versions, this
	// behavior was linked on shift-click, instead.
	stage.mouseControls.remove("clickPick-left");
	// Bind our own selection beheviour.
    // We need to use the "arrow" function so that `this` is defined and refer
    // to the right object in the `onClick` method. See
    // <https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback>.
    stage.signals.clicked.add((pickingProxy) => vizu.onClick(pickingProxy));

    // Bing the new bead buttons.
    var buttons = document.getElementsByClassName("new-bead");
    for (button of buttons) {
        button.onclick = (event) => vizu.onNewBead(event);
    }
}

window.onload = main;
