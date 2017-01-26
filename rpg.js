"use strict";
var RPG = {
	W: 128,
	H: 128,
	scale: null,
	canvas: null,
	ctx: null,
	text: null,
	p: [],
	map: {
		x: 0,
		y: 0,
		rooms: []
	},
	round: {
		map: false,
		saves: 0,
		switched: 0,
		mutate: []
	},
	player: {
		p: null,
		x: 0,
		y: 0,
		target: {
			x: -1,
			y: -1
		},
		xray: null
	},
	trophies: {},
	totals: {
		games: 0
	},
	mutpower: 0,
	input: {
		up: false,
		down: false,
		left: false,
		right: false,
		action: false,
		pointer: {
			x: 0,
			y: 0,
			click: false
		}
	},
	arrow: {
		show: false,
		type: 0,
		x: 0,
		y: 0
	},
	scroll: {
		step: 0,
		dir: "",
		target: {
			x: -1,
			y: -1
		}
	},
	mode: "title",
	nextmode: "",
	modestart: 0,
	modeend: 0,
	notice: {
		until: 0,
		text: "",
		trophy: false
	},
	talkto: null,
	baby: null,
	conv: null,
	menu: null,
	ready: false,
	lastframe: 0,
	frametime: 0,
	tickwait: Math.floor(1000 / 60), //60fps
	tick: 0
};

function localGet(key) {
	if(localStorage) {
		return localStorage.getItem(key);
	}
}
function localSet(key, val) {
	if(localStorage) {
		return localStorage.setItem(key, val);
	}
}

function lerp(from, to, prog) {
	return (1 - prog) * from + prog * to;
};
function derp(from, to, prog) {
	// digital lerp.  get it?  ...derp.
	return Math.floor(lerp(from, to, prog));
};

function blink() {
	return Math.floor(RPG.tick / 10) % 2;
}

function trophy(text) {
	if(RPG.trophies[text]) {
		return;
	}
	RPG.trophies[text] = true;
	RPG.notice.text = text;
	RPG.notice.trophy = true;
	RPG.notice.until = RPG.tick + (60 * 4);
	localSet("trophies", JSON.stringify(RPG.trophies));
}
function check_allrooms() {
	var all= true;
	RPG.map.rooms.every(function(row) {
		row.every(function(room) {
			if(room && !room.visited) {
				all = false;
			}
			return all;
		});
		return all;
	});
	return all;
}
function check_population() {
	var total = 0;
	RPG.map.rooms.every(function(row) {
		row.every(function(room) {
			if(room && room.p) {
				total += room.p.length;
			}
			return true;
		});
		return true;
	});
	return total;
}
function check_alltalk() {
	var all = true;
	RPG.p.every(function(p) {
		if(!p.talked) {
			all = false;
		}
		return all;
	});
	return all;
}
function check_allwalk() {
	var all = true;
	RPG.p.every(function(p) {
		if(!p.walked) {
			all = false;
		}
		return all;
	});
	return all;
}

function randomdirection() {
	return "nesw".charAt(Math.floor(Math.random() * 4));
}
function randomname() {
	var con = [
		"B",
		"C",
//		"CH",
		"D",
//		"DR",
//		"DN",
		"F",
		"G",
//		"GR",
		"H",
		"J",
		"K",
		"L",
		"M",
//		"MB",
		"N",
//		"ND",
//		"NDR",
		"P",
//		"PR",
//		"QU",
		"R",
//		"RL",
		"S",
//		"SH",
//		"ST",
		"T",
		"TH",
		"V",
		"W",
//		"X",
		"Z"
//		"ZH"
	];
	var vow = [
		"A",
		"E",
		"I",
		"O",
		"U"
//		"OU",
//		"UI",
//		"IA",
//		"IO"
	];
	var v = (Math.random() < 0.5);
	var len = Math.floor(Math.random() * 4) + 2;
	var name = "";
	while(len) {
		if(v) {
			name += vow[Math.floor(Math.random() * vow.length)];
		} else {
			name += con[Math.floor(Math.random() * con.length)];
		}
		v = !v;
		--len;
	}
	return name;
}

function greeting() {
	//ALL OF ABOVE!
	var greets = [
		"YOU SEE ME?",
		"HOWDY!",
		"HELLO.",
		"ARE YOU NEW?",
		"YOU FOUND ME!",
		"LOVELY DAY.",
		"i'm weird...",
		"GREETINGS!",
		"HI.",
		"YO.",
		"HEY.",
		"HELLO THERE.",
		"WHAT NOW?",
		"WELL MET.",
		"GOOD DAY!",
		"PARDON ME...",
		"I SAY...",
		"HUH?",
		"HMM?",
		"WHAT?",
		"WHAT IS IT?",
		"NOW WHAT?",
		"YAWN...",
		"HI HO!",
		"UFF DA.",
		"BINK.",
		"WHAT'S THIS?",
		"HOW ARE YOU?",
		"WHAT'S UP?",
		"I DO SAY!",
		"WELL I NEVER!",
		"YES HI.",
		"YES HELLO.",
		"DUDE...",
		"HEY MAN",
		"IT'S YOU!",
		"IT'S ME!",
		"WHO IS THAT?",
		"ARE YOU REAL?",
		"CAN I HELP?",
		"VERY WELL!",
		"SO BE IT",
		"I'M AWAKE...",
		"YES?",
		"RIGHT THEN!",
		"UH-OH.",
		"HELLO HELLO!",
		"HOWDY HOWDY!",
		"HA HA HI!"
//		"MAX OF LENGTH",
	];
	return greets[Math.floor(Math.random() * greets.length)];
}

function generate() {
	var p = {
		name: randomname(),
		color: {},
		shape: [],
		greet: greeting(),
		talked: false,
		walked: false,
		face: [],  // visibility to others
		eyes: [],  // see others 1~4 x 1~4
		nose: [],  // see terrain 1~4 x 1~4
		feet: [],  // barriers passable (hidden)
		ears: 1,   // 0=can't listen, 2=special ops
		relatives: [],
		map: false,
		crown: false,
		trade: null
	};
	var i = 0;
	var j = 0;
	var trait = [
		null, "eyes", "nose", "feet", "shape", "color"
	];
	p.trade = trait[Math.floor(Math.random() * trait.length)];
	p.color.r = Math.random();
	p.color.g = Math.random();
	p.color.b = Math.random();
	while(p.color.r + p.color.g + p.color.b < 1) {
		switch(Math.floor(Math.random() * 3)) {
		case 0:
			p.color.r = 1 - p.color.r;
			break;
		case 0:
			p.color.g = 1 - p.color.g;
			break;
		default:
			p.color.b = 1 - p.color.b;
			break;
		}
	}
	for(i = 0; i < 4; ++i) {
		p.shape.push(Math.floor(Math.random() * 255) + 1);
	}

//	p.x = Math.floor(Math.random() * RPG.W);
//	p.y = Math.floor(Math.random() * RPG.H);
	p.x = Math.floor((Math.random() * RPG.W / 2) + (RPG.W / 4));
	p.y = Math.floor((Math.random() * RPG.H / 2) + (RPG.H / 4));

	p.dir = "";//randomdirection();
	//p.walking = (Math.random() < 0.5);

	p.face = [Math.floor(Math.random() * 3) + 1];
	p.face.push(p.face[0] + 1);
	["eyes", "feet", "nose"].every(function(attr) {
//		for(i = Math.floor(Math.random() * 4); i >= 0; --i) {
		for(i = 4; i >= 0; --i) {
			j = Math.floor(Math.random() * 4) + 1;
			if(p[attr].indexOf(j) < 0) {
				p[attr].push(j);
			}
		}
		return true;
	});
	if(Math.random() < 0.1) {
		p.ears = 0;
	} else if(Math.random() < 0.1) {
		p.ears = 2;
	}

	if(Math.random() < 0.1) {
		p.map = true;
		RPG.round.map = true;
	}

	return p;
}

function mutate(p) {
	var h = offspring(p, generate());
	var q = offspring(p, h);
	var e = offspring(p, q);
	["name", "map", "crown", "talked", "walked", "trade"].every(function(a) {
		e[a] = p[a];
		return true;
	});
	--RPG.mutpower;
	RPG.round.mutate = RPG.round.mutate || [];
	if(RPG.round.mutate.indexOf(p.name) < 0) {
		RPG.round.mutate.push(p.name);
	}
	if(RPG.round.mutate.length >= 20) {
		trophy("MAXIMUMUTANTS");
	}
	return e;
}

function offspring(a, b) {
	var c = {
		name: randomname(),
		greet: greeting(),
		color: {},
		shape: [],
		x: Math.floor((a.x + b.x) / 2),
		y: Math.floor((a.y + b.y) / 2),
		relatives: [a.name, b.name]
	};
	a.relatives.push(c.name);
	b.relatives.push(c.name);
	var i = 0;
	var j = 0;
	var trait = [
		null, "eyes", "nose", "feet", "shape", "color"
	];
	c.trade = trait[Math.floor(Math.random() * trait.length)];
	c.color.r = (a.color.r + b.color.r) / 2;
	c.color.g = (a.color.g + b.color.g) / 2;
	c.color.b = (a.color.b + b.color.b) / 2;
	for(i = 0; i < 4; ++i) {
		c.shape.push(Math.floor((a.shape[i] + b.shape[i]) / 2));
	}

	//TODO: inherit these from parents
	//mix + pick one to be direct from 'a'?
	["eyes", "nose", "face", "feet"].every(function(attr) {
		//		for(i = Math.floor(Math.random() * 4); i >= 0; --i) {
		c[attr] = [];
		for(i = 4; i >= 0; --i) {
			j = Math.floor(Math.random() * 4) + 1;
			if(c[attr].indexOf(j) < 0) {
				c[attr].push(j);
			}
		}
		return true;
	});
	if(Math.random() < 0.1) {
		c.ears = 0;
	} else if(Math.random() < 0.1) {
		c.ears = 2;
	}
	if(Math.random() < 0.01) {
		c.crown = true;
	}

	//be visible to parents
	if(!cansee([a], c.face)) {
		c.face.push(a.eyes[0]);
	}
	if(!cansee([b], c.face)) {
		c.face.push(b.eyes[0]);
	}

	return c;
}

function draw(p, x, y) {
	var scale = RPG.scale;
	var i, j;
	var ctx;
	if(typeof x === undefined) {
		x = p.x || 0;
	}
	if(typeof y === undefined) {
		y = p.y || 0;
	}
	RPG.ctx.save();
	if(!p.canvas) {
		p.canvas = document.createElement("canvas");
		p.canvas.width = p.canvas.height = 8;
		ctx = p.canvas.getContext("2d");
		ctx.fillStyle = [
			"rgb(",
			Math.floor(p.color.r * 255), ",",
			Math.floor(p.color.g * 255), ",",
			Math.floor(p.color.b * 255),
			")"
		].join("");
		p.shape.every(function(slice, i) {
			for(j = 0; j < 8; ++j) {
				if(slice & Math.pow(2, j)) {
					ctx.fillRect(i, j, 1, 1);
					ctx.fillRect(7 - i, j, 1, 1);
				}
			}
			return true;
		});
	}
	if(!p.canvaswalk) {
		p.canvaswalk = document.createElement("canvas");
		p.canvaswalk.width = p.canvaswalk.height = 8;
		ctx = p.canvaswalk.getContext("2d");
		ctx.drawImage(p.canvas, 0, 0, 8, 6,
					  0, 0, 8, 6);
		ctx.drawImage(p.canvas, 0, 6, 4, 2,
					  0, 6, 4, 2);
		ctx.drawImage(p.canvas, 4, 6, 4, 2,
					  4, 5, 4, 2);
	}

	if(p.crown) {
		RPG.ctx.drawImage(RPG.text,
						  blink() ? 8 : 0,
						  8 * 3, 8, 8,
						  x * scale, (y - 8) * scale,
						  8 * scale, 8 * scale);
	}

	if(p.walking) {
		RPG.ctx.translate(x * scale, y * scale);
		if(blink()) {
			RPG.ctx.scale(-1, 1);
			RPG.ctx.translate(-8 * scale, 0);
		}
		RPG.ctx.drawImage(p.canvaswalk,
						  0, 0, 8, 8,
						  0, 0,
						  8 * scale, 8 * scale);
	} else {
		RPG.ctx.drawImage(p.canvas, 0, 0, 8, 8,
						  x * scale, y * scale, 8 * scale, 8 * scale);
	}

	RPG.ctx.restore();
}

function arrow(dir, x, y, scale) {
	var scale = RPG.scale;
	var sx = 32;
	var sy = 0;
	if(dir === 1) {
		++sx;
	} else if(dir === 2) {
		++sy;
	} else if(dir === 3) {
		++sx;
		++sy;
	}
	RPG.ctx.save();
	RPG.ctx.drawImage(RPG.text, sx * 8, sy * 8, 8, 8,
					  x * scale, y * scale, 8 * scale, 8 * scale);
	RPG.ctx.restore();
}

function makemap() {
	var i;
	var j;
	var room = null;
	var rooms = [];
	var motifs = [
		"c", "t",  // city, turrets
		"f", "b",  // flowers, bonbons
		"h", "p",  // houses, pyramids
		"w", "s"   // woods, shrubs
	];
  	var r = Math.random() * 0.2;
	var g = Math.random() * 0.2;
	var b = Math.random() * 0.2;
	RPG.map.rooms = [];

	for(i = 0; i < 16; ++i) {
		RPG.map.rooms.push([]);
		for(j = 0; j < 16; ++j) {
			RPG.map.rooms[i].push(null);
		}
	}

	// starting room
	RPG.map.x = Math.floor(Math.random() * 14) + 1;
	RPG.map.y = Math.floor(Math.random() * 14) + 1;
	var x = RPG.map.x;
	var y = RPG.map.y;
	var motif = motifs[Math.floor(Math.random() * motifs.length)];
	rooms.push({
		x: x,
		y: y,
		room: {
			n: 0,
			e: 0,
			s: 0,
			w: 0,
			idx: 0,
			visited: true,
			motif: motif,
			color: {
				r: r,
				g: g,
				b: b
			},
			special: null  //"mutate" xray throne
		}
	});
	RPG.map.rooms[y][x] = rooms[rooms.length - 1].room;

	// build 100 rooms, each one off a random existing room
	var from = 0;
	var dir = randomdirection();  // n/e/s/w
	var pass = 0;  // 1-4: flavors of openings
	var newroom = null;
	var stahp = 0;
	var special = [];
	var openwalls = function(r) {
		var ow = 0;
		"nesw".split("").every(function(d) {
			++ow;
			return true;
		});
		return ow;
	}
	while(rooms.length < 100 && stahp < 10000) {
		++stahp;
		// build off the last room most of the time
		if(Math.random() < 0.2) {
			from = Math.floor(Math.random() * rooms.length);
		} else {
			from = rooms.length - 1;
		}
		x = rooms[from].x;
		y = rooms[from].y;
		//console.log("build from", x, y);
		if(x < 1 || x > 14 || y < 1 || y > 14) {
			// edge of the map, build elsewhere
			//console.log("skip A");
			continue;
		}
		if(Math.random() < 0.2) {
			// go the same direction as before most of the time
			dir = randomdirection();
		}
		if(Math.random() < 0.2) {
			// use the same motif as before most of the time
			motif = motifs[Math.floor(Math.random() * motifs.length)];
  			r = Math.random() * 0.2;
			g = Math.random() * 0.2;
			b = Math.random() * 0.2;
		} else {
  			r += (Math.random() * 0.2) - 0.1;
			g += (Math.random() * 0.2) - 0.1;
			b += (Math.random() * 0.2) - 0.1;
			r = Math.max(0, Math.min(0.3, r));
			g = Math.max(0, Math.min(0.3, g));
			b = Math.max(0, Math.min(0.3, b));
		}
		if(rooms[from].room[dir] > 0) {
			// already open on this side, build elsewhere
			//console.log("skip B", rooms[from].room);
			continue;
		}
		pass = Math.floor(Math.random() * 4) + 1;
		rooms[from].room[dir] = pass;
		switch(dir) {
		case "n":
			--y;
			break;
		case "e":
			++x;
			break;
		case "s":
			++y;
			break;
		case "w":
		default:
			--x;
			break;
		}
		// new passage to an existing room, or new room
		newroom = RPG.map.rooms[y][x] || {
			n: 0,
			e: 0,
			s: 0,
			w: 0,
			motif: motif,
			color: {
				r: r,
				g: g,
				b: b
			}
		};
		switch(dir) {
		case "n":
			newroom.s = pass;
			break;
		case "e":
			newroom.w = pass;
			break;
		case "s":
			newroom.n = pass;
			break;
		case "w":
		default:
			newroom.e = pass;
			break;
		}
		if(newroom.idx) {
			//console.log("through an old room");
			rooms[newroom.idx].room = newroom;
			RPG.map.rooms[y][x] = newroom;
		} else {
			//console.log("new room");
			newroom.idx = rooms.length;
			rooms.push({
				x: x,
				y: y,
				room: newroom
			});
			RPG.map.rooms[y][x] = newroom;
		}
/* duh, all are like this at first...
		if(openwalls(newroom) > 2) {
			special.push({
				x: x,
				y: y
			});
		}
		*/
	}
	if(rooms.length < 100) {
		console.log("badness");
	}
	var spec = [
		"throne",
		"xray",
		"mutate",
		"maps"
	];
	var unique = function(sx, sy) {
		if(!RPG.map.rooms[sy][sx]) {
			return false;
		}
		var found = false;
		special.every(function(r) {
			if(r.x === sx && r.y === sy) {
				found = true;
			}
			return found;
		});
		return !found;
	};
	var rx = 0;
	var ry = 0;
	while(special.length < spec.length) {
		rx = Math.floor(Math.random() * RPG.map.rooms[0].length);
		ry = Math.floor(Math.random() * RPG.map.rooms.length);
		if(RPG.map.rooms[rx][ry]) {
			if(unique(rx, ry)) {
				special.push({
					x: rx,
					y: ry
				});
			}
		}
	}
	// enough candidate rooms, todo: fill 'em
	var rm;
	var idx = 0;
	var tx;
	var ty;
	console.log("spec", spec.length, special.length, idx);
	while(spec.length && special.length > idx) {
		rm = spec.splice(Math.floor(Math.random() * spec.length), 1)[0];
		tx = special[idx].x;
		ty = special[idx].y;
		RPG.map.rooms[ty][tx].special = rm;
		console.log("special", tx, ty, rm);
		++idx;
	}
}

function populate() {
	var rooms = [];
	var i;
	var rnd;
	RPG.map.rooms.every(function(row) {
		row.every(function(room) {
			if(room) {
				rooms.push(room);
			}
			return true;
		});
		return true;
	});
	console.log(rooms.length, " rooms");
	for(i = 0; i < 85; ++i) {
		rnd = Math.floor(Math.random() * rooms.length);
		rooms[rnd].p = rooms[rnd].p || [];
		rooms[rnd].p.push(generate());
		if(Math.random() < 0.1) {
			rooms[rnd].p[rooms[rnd].p.length-1].crown = true;
		}
		if(rooms[rnd].special === "maps") {
			// everyone in the map room took one
			rooms[rnd].p[rooms[rnd].p.length-1].map = true;
		}
	}
}

function canreach(legs, rooms, sx, sy) {
	//todo: use to figure out where to put some npcs
	// to guarantee map can be cleared
}

function cansee(ps, types) {
	var visible = false;
	(ps || []).every(function(p) {
		types.every(function(type) {
			if(p.eyes.indexOf(type) >= 0) {
				visible = true;
			}
			return !visible;
		});
		return !visible;
	});
	return visible;
}

function drawbarrier(dir, motif) {
	var x = 0;
	var y = 0;
	var w = 8;
	var h = 8;
	var v = 0;  // 1 == vertical
	switch(dir) {
	case "n":
		x = 32;
		w = 64;
		break;
	case "e":
		x = 120;
		y = 32;
		h = 64;
		v = 1;
		break;
	case "s":
		x = 32
		y = 120;
		w = 64;
		break;
	case "w":
	default:
		y = 32;
		h = 64;
		v = 1;
		break;
	}
	RPG.ctx.save();
	if(motif) {
		var c = motif.charCodeAt(0);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8, (4 + v) * 8, 8, 8,
						  x * RPG.scale, y * RPG.scale,
						  w * RPG.scale, h * RPG.scale);
	} else {
		RPG.ctx.fillStyle = "#ccc";
		RPG.ctx.fillRect(x * RPG.scale, y * RPG.scale,
						 w * RPG.scale, h * RPG.scale);
	}
	RPG.ctx.restore();
}
function drawroom(room, offx, offy) {
	room = room || RPG.map.rooms[RPG.map.y][RPG.map.x] || {
		n: 0, e: 0, s: 0, w: 0
	};
	var motif = room.motif || "x";
	["ct", "fb", "hp", "ws"].every(function(m, i) {
		if(RPG.player.p.nose.indexOf(i + 1) < 0 &&
		   m.indexOf(motif) >= 0) {
			motif = "x";
		}
		return true;
	});

	RPG.ctx.save();
	RPG.ctx.translate(offx * RPG.scale, offy * RPG.scale);

	var walls = 0;
	["n", "e", "s", "w"].every(function(dir) {
		if(room[dir] && RPG.player.p.feet.indexOf(room[dir]) >= 0) {
			// open
		} else {
			drawbarrier(dir, motif);
			++walls;
			//text(dir, ("nesw".indexOf(dir)+8)*8,8*8);
		}
		return true;
	});
	if(walls > 3) {
		trophy("NOWHERE TO GO")
	}

	if(motif) {
		var c = motif.charCodeAt(0);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8, 3 * 8, 8, 8,
						  0, 0, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8, 3 * 8, 8, 8,
						  96 * RPG.scale, 0, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8, 3 * 8, 8, 8,
						  0, 96 * RPG.scale, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8, 3 * 8, 8, 8,
						  96 * RPG.scale, 96 * RPG.scale,
						  32 * RPG.scale, 32 * RPG.scale);
	} else {
		RPG.ctx.fillStyle = "#888";
		RPG.ctx.fillRect(0, 0, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.fillRect(96 * RPG.scale, 0, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.fillRect(0, 96 * RPG.scale, 32 * RPG.scale, 32 * RPG.scale);
		RPG.ctx.fillRect(96 * RPG.scale, 96 * RPG.scale,
						 32 * RPG.scale, 32 * RPG.scale);
	}

	var c = 0;
	if(room.special) {
		switch(room.special) {
		case "throne":
			text("THRONE", 5 * 8, 1 * 8);
			text("ROOM", 6 * 8, 2 * 8);
			c = "g".charCodeAt(0);
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 3 * 8,
							  8, 8,
							  6 * 8 * RPG.scale,
							  3 * 8 * RPG.scale,
							  8 * 4 * RPG.scale,
							  8 * 4 * RPG.scale);
/*
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 3 * 8,
							  8, 8,
							  7 * 8 * RPG.scale,
							  3 * 8 * RPG.scale,
							  8 * 2 * RPG.scale,
							  8 * 2 * RPG.scale);
*/
			if(RPG.ready &&
			   RPG.player.x >= 5 * 8 &&
			   RPG.player.x <= 10 * 8 &&
			   RPG.player.y >= 3 * 8 &&
			   RPG.player.y <= 6 * 8) {
				RPG.player.p.crown = true;
				trophy("FINISHED RPG1");
				if(!RPG.round.saves) {
					trophy("SINGLESEGMENT");
				}
				if(!RPG.round.switched) {
					trophy("ALL BY MYSELF");
				}
				if(!RPG.round.map) {
					trophy("MAPLESS CROWN");
				}
				//todo: you win dialog?
			}
			break;
		case "mutate":
			text("MUTATION", 4 * 8, 1 * 8);
			text("STATION", 5 * 8, 2 * 8);
			text("IN...OUT", 4 * 8, 6 * 8);
			text("  \\??/  ", 4 * 8, 7 * 8);
			text("  /??\\  ", 4 * 8, 8 * 8);
			text("POWER:"+RPG.mutpower, 4 * 8, 9 * 8);
			c = "x".charCodeAt(0);
/*
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 4 * 8,
							  8, 8,
							  4 * 8 * RPG.scale,
							  7 * 8 * RPG.scale,
							  8 * 2 * RPG.scale,
							  8 * 2 * RPG.scale);
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 4 * 8,
							  8, 8,
							  10 * 8 * RPG.scale,
							  7 * 8 * RPG.scale,
							  8 * 2 * RPG.scale,
							  8 * 2 * RPG.scale);
*/
			if(RPG.ready &&
			   RPG.mutpower > 0 &&
			   RPG.player.x >= 4 * 8 &&
			   RPG.player.x <= 6 * 8 &&
			   RPG.player.y >= 7 * 8 &&
			   RPG.player.y <= 8 * 8) {
				RPG.player.p = mutate(RPG.player.p);
				RPG.player.x += 8 * 6;
				RPG.player.target.x = -1;
				RPG.player.target.y = -1;
			}
			break;
		case "maps":
			text("FREE", 6 * 8, 1 * 8);
			text("MAPS", 6 * 8, 2 * 8);
			c = "x".charCodeAt(0);
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 4 * 8,
							  8, 8,
							  7 * 8 * RPG.scale,
							  3 * 8 * RPG.scale,
							  8 * 2 * RPG.scale,
							  8 * 2 * RPG.scale);
			if(RPG.ready &&
			   RPG.player.x >= 5 * 8 &&
			   RPG.player.x <= 10 * 8 &&
			   RPG.player.y >= 3 * 8 &&
			   RPG.player.y <= 6 * 8) {
				RPG.player.p.map = true;
				RPG.round.map = true;
				//todo: you got a map dialog
			}
			break;
		case "xray":
			text("XRAY", 6 * 8, 1 * 8);
			text("SCAN", 6 * 8, 2 * 8);
			c = "x".charCodeAt(0);
			RPG.ctx.drawImage(RPG.text,
							  c % 32 * 8, 4 * 8,
							  8, 8,
							  6 * 8 * RPG.scale,
							  3 * 8 * RPG.scale,
							  8 * 4 * RPG.scale,
							  8 * 4 * RPG.scale);
			if(RPG.ready &&
			   RPG.player.x >= 5 * 8 &&
			   RPG.player.x <= 10 * 8 &&
			   RPG.player.y >= 3 * 8 &&
			   RPG.player.y <= 6 * 8) {
				if(!RPG.player.xray) {
					var dna = ["DNA:"];
					var x = {
						eyes: ["EYES: "],
						nose: ["NOSE: "],
						face: ["FACE: "],
						feet: ["FEET: "]
					};
					var str = "";
					RPG.player.p.shape.every(function(g) {
						str = g.toString(16).toUpperCase();
						if(str.length < 2) {
							str = "0" + str;
						}
						dna.push(str);
						return true;
					});
					[1, 2, 3, 4].every(function(n) {
						["eyes", "nose", "face", "feet"].every(function(f) {
							if(RPG.player.p[f].indexOf(n) >= 0) {
								x[f].push("+");
							} else {
								x[f].push("-");
							}
							return true;
						});
						return true;
					});
					RPG.player.xray = {};
					RPG.player.xray.dna = dna.join("");
					["eyes", "nose", "face", "feet"].every(function(a) {
						RPG.player.xray[a] = x[a].join("");
						return true;
					});
				}
				text(RPG.player.xray.dna, 2 * 8, 7 * 8);
				text(RPG.player.xray.eyes, 3 * 8, 8 * 8);
				text(RPG.player.xray.nose, 3 * 8, 9 * 8);
				text(RPG.player.xray.face, 3 * 8, 10 * 8);
				text(RPG.player.xray.feet, 3 * 8, 11 * 8);
			} else {
				/*
				text("DNA:--------", 2 * 8, 7 * 8);
				text("EYES: ----", 3 * 8, 8 * 8);
				text("NOSE: ----", 3 * 8, 9 * 8);
				text("FACE: ----", 3 * 8, 10 * 8);
				text("FEET: ----", 3 * 8, 11 * 8);
				*/
			}
			break;
		}
	}
	/*
	  +--------------+
	  |  |        |  |
	  |  |  XRAY  |  |
	  |--+  SCAN  +--|
	  |              |
	  |     ####     |
	  |     #  #     |
	  |   DNA: 3A6C  |
	  |  EYES: +-++  |
	  |  NOSE: -++-  |
	  |  FACE: ++--  |
	  |  FEET: -+-+  |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  | THRONE |  |
	  |--+  ROOM  +--|
	  |              |
	  |      ##      |
	  |      ##      |
	  |    ######    |
	  |    ##  ##    |
	  |    ##  ##    |
	  |              |
	  |  WINS: 0001  |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |MUTATION|  |
	  |--+ STATION+--|
	  |              |
	  |   IN   OUT   |
	  |   ########   |
	  |     #??#     |
	  |     #??#     |
	  |   ########   |
	  |   POWER:09   |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |  FREE  |  |
	  |--+  MAPS  +--|
	  |              |
	  |     TAKE     |
	  |     ONE      |
	  |       #      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |  EYES  |  |
	  |--+ DOCTOR +--|
	  |              |
	  |              |
	  |       O      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |  FEET  |  |
	  |--+ DOCTOR +--|
	  |              |
	  |              |
	  |       O      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |  GOOD  |  |
	  |--+ ADVICE +--|
	  |              |
	  |              |
	  |       O      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  |  TASTY |  |
	  |--+ GOSSIP +--|
	  |              |
	  |              |
	  |       O      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */
	/*
	  +--------------+
	  |  |        |  |
	  |  | SECRET |  |
	  |--+ FACTS  +--|
	  |              |
	  |              |
	  |       O      |
	  |              |
	  |              |
	  |              |
	  |              |
	  |              |
	  |--+        +--|
	  |  |        |  |
	  |  |        |  |
	  +--------------+
	 */


	RPG.ctx.restore();


	//text(JSON.stringify(room), 0 * 8, 4 * 8, 0.5);
	//text(JSON.stringify(RPG.player.p.feet), 0 * 8, 3 * 8);
}

function drawmap() {
	RPG.ctx.save();
	var x = 0;
	var y = 0;
	var w = 4;
	var h = 4;
	RPG.ctx.fillStyle = "beige";
	RPG.ctx.fillRect(24 * RPG.scale, 24 * RPG.scale,
					 80 * RPG.scale, 80 * RPG.scale);
	RPG.map.rooms.every(function(row) {
		x = 0;
		row.every(function(room) {
			if(room) {
				if(x === RPG.map.x && y === RPG.map.y) {
					RPG.ctx.fillStyle = "yellow";
					if(blink()) {
						RPG.ctx.fillStyle = "gold";
					}
				} else if(room.special) {
					RPG.ctx.fillStyle = "limegreen";
				} else if(room.visited) {
					RPG.ctx.fillStyle = "peru";
				} else {
					RPG.ctx.fillStyle = "tan";
				}
				RPG.ctx.fillRect((32 * RPG.scale) + (x * w * RPG.scale),
								 (32 * RPG.scale) + (y * h * RPG.scale),
								 w * RPG.scale, h * RPG.scale);
			}
			++x;
			return true;
		});
		++y;
		return true;
	});
	RPG.ctx.restore();
}

function text(str, x, y, scale) {
	scale = scale ? RPG.scale * scale : RPG.scale;
	var c;
	RPG.ctx.save();
	for(var i = 0; i < str.length; ++i) {
		c = str.charCodeAt(i);
		RPG.ctx.drawImage(RPG.text, c % 32 * 8,
						  Math.floor((c-32) / 32) * 8,
						  8, 8, x * scale, y * scale, 8 * scale, 8 * scale);
		x += 8;
	}
	RPG.ctx.restore();
}

function draw_conv(lines, offset) {
	var y = 9;
	lines = lines || RPG.conv || [];
	offset = offset || 8;
	lines.every(function(line, i) {
		text(line, offset, 8 * (y + i));
		return true;
	});
}
function draw_menu() {
	draw_conv(RPG.menu, 8);
}

function menuhandle(row) {
	var room = RPG.map.rooms[RPG.map.y][RPG.map.x];
	var leave = 0;
	if(!RPG.menu) {
		return 0;
	}
//	console.log(RPG.menu[row]);
	switch(RPG.menu[row]) {
	case "VIEW MAP":
		leave = 500;
		RPG.nextmode = "map";
		break;
	case "VIEW TROPHIES":
		leave = 500;
		RPG.nextmode = "trophies";
		break;
	case "SAVE AND QUIT":
		RPG.round = RPG.round || {};
		RPG.round.saves = RPG.round.saves || 0;
		++RPG.round.saves;
		localSet("game", JSON.stringify({
			p: RPG.p,
			round: RPG.round,
			map: RPG.map,
			player: RPG.player,
			mutpower: RPG.mutpower
		}, function(key, val) {
			if(key.indexOf("canvas") >= 0) {
				return undefined;
			}
			return val;
		}));
		localSet("totals", JSON.stringify(RPG.totals));
		leave = 500;
		RPG.nextmode = "title";
		break;
	case "BE ME":
		RPG.player.xray = null;
		RPG.round.switched = RPG.round.be || 0;
		++RPG.round.switched;
		RPG.player.p.walked = true;
		RPG.talkto.walked = true;
		if(check_allwalk()) {
			trophy("MILE PER SHOE");
		}

		var tmp = RPG.player.p;
		tmp.x = RPG.player.x;
		tmp.y = RPG.player.y;
		RPG.player.p = RPG.talkto;
		RPG.player.x = RPG.player.p.x;
		RPG.player.y = RPG.player.p.y;
		RPG.player.x = Math.max(8, RPG.player.x);
		RPG.player.x = Math.min(RPG.W - 16, RPG.player.x);
		RPG.player.y = Math.max(8, RPG.player.y);
		RPG.player.y = Math.min(RPG.H - 16, RPG.player.y);
		RPG.player.p.walking = false;
		tmp.walking = false;
		room.p[room.p.indexOf(RPG.talkto)] = tmp;
		RPG.talkto = tmp;
		leave = 500;
		break;
	case "MAKE OFFSPRING":
		RPG.player.p.x = RPG.player.x;
		RPG.player.p.y = RPG.player.y;
		var bb = offspring(RPG.player.p, RPG.talkto);
		RPG.baby = bb;
		room.p.push(bb);
		if(check_population() >= 120) {
			trophy("TOO MANY KIDS");
		}
		leave = 2000;
		break;
	case "TAKE MY MAP":
		RPG.player.p.map = true;
		RPG.talkto.map = false;
		leave = 500;
		break;
	case "TAKE MY CROWN":
		RPG.player.p.crown = true;
		RPG.talkto.crown = false;
		leave = 500;
		break;
	default:
		if(RPG.menu[row].indexOf("TRADE ") === 0) {
			//RPG.player.p = RPG.talkto;
			var trade = RPG.talkto.trade;
			var temp = null;
			temp = RPG.player.p[trade];
			console.log(temp);
			RPG.player.p[trade] = RPG.talkto[trade];
			RPG.talkto[trade] = temp;
			RPG.player.p.canvas = null;
			RPG.player.p.canvaswalk = null;
			RPG.talkto.canvas = null;
			RPG.talkto.canvaswalk = null;
		} else {
			RPG.nextmode = "play";
		}
		leave = 500;
		break;
	}
	return leave;
}

function init(skipload) {
//	RPG.p.push(generate());
//	RPG.p.push(generate());
//	RPG.p.push(offspring(RPG.p[0], RPG.p[1]));
	var saved = localGet("game");
	var stotal = localGet("totals");
	if(saved && !skipload) {
		try {
			saved = JSON.parse(saved);
		} catch(ignore) {
			alert("corrupt save data ignored.");
			saved = null;
		}
	}
	if(saved && !skipload) {
		RPG.p = saved.p;
		RPG.map = saved.map;
		RPG.player = saved.player;
		RPG.mutpower = saved.mutpower;
		RPG.arrow.show = false;
		RPG.mode = "play";

		try {
			//console.log(stroph);
			stotal = JSON.parse(stotal);
		} catch(ignore) {
			alert("corrupt totals data ignored.");
			stotal = {};
		}
		RPG.totals = stotal || {};
	} else {
		RPG.p = [];
		for(var i = 0; i < 8 * 6; ++i) {
			RPG.p.push(generate());
		}
		makemap();
		populate();
		RPG.mutpower = 20;
	}
	RPG.ready = true;
}

function render_title(time) {
	RPG.ctx.save();
	RPG.ctx.fillStyle = "black";
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);

	RPG.p.every(function(p, idx) {
		draw(p, p.x, p.y);
		return idx < 10;
	});

	text("RPG1", 2 * 8, 2 * 8, 2);
	if(localGet("game")) {
		text("CONTINUE", 4 * 8, 10 * 8);
	}
	text("NEW GAME", 4 * 8, 11 * 8);
	text("MANUAL", 4 * 8, 12 * 8);
	//arrow(0, 3 * 8, 11 * 8);
	RPG.ctx.restore();
}

function render_select(time) {
	RPG.ctx.save();
	RPG.ctx.fillStyle = "black";
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);
//	drawbarrier("n");
//	drawbarrier("e");
//	drawbarrier("s");
//	drawbarrier("w");
	text("WHO ARE YOU?", 2 * 8, 1 * 8);
	if(RPG.ready) {
		var i = 0;
		var j = 4;
		RPG.p.every(function(p) {
			p.walking = false;
			draw(p, 4 + i * 8, j * 8);
			i += 2;
			if(i >= 16) {
				i = 0;
				j += 2;
			}
			return true;
		});
	} else {
		text(RPG.player.p.name, 2 * 8, 2 * 8);
		draw(RPG.player.p, RPG.player.x, RPG.player.y);
	}
	RPG.ctx.restore();
}

function render_play(time) {
	RPG.ctx.save();
	var room = RPG.map.rooms[RPG.map.y][RPG.map.x];
	if(room.color) {
		RPG.ctx.fillStyle = [
			"rgb(",
			Math.floor(room.color.r * 255), ",",
			Math.floor(room.color.g * 255), ",",
			Math.floor(room.color.b * 255),
			")"
		].join("");
	} else {
		RPG.ctx.fillStyle = "black";
	}
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);
	var x = 0;
	var y = 0;
	var nx = 0;
	var ny = 0;
	if(RPG.scroll.dir) {
		switch(RPG.scroll.dir) {
		case "n":
			y = RPG.scroll.step * 8;
			ny = y - RPG.H;
			break;
		case "e":
			x = RPG.scroll.step * -8;
			nx = x + RPG.W;
			break;
		case "s":
			y = RPG.scroll.step * -8;
			ny = y + RPG.H
			break;
		case "w":
		default:
			x = RPG.scroll.step * 8;
			nx = x - RPG.W;
			break;
		}
		drawroom(null, x, y);
		drawroom(RPG.map.rooms[RPG.scroll.target.y][RPG.scroll.target.x],
				 nx, ny);
	} else {
		drawroom();
		(room.p || []).every(function(p) {
			if(cansee([RPG.player.p], p.face)) {
				draw(p, p.x, p.y);
//			} else {
//				draw(p, 1, 1);
			}
			return true;
		});
	}

	draw(RPG.player.p, RPG.player.x, RPG.player.y);
	//text("x:"+RPG.map.x+" y:"+RPG.map.y, 1 * 8, 1 * 8);
	/*
	text(JSON.stringify(RPG.input), 0, 0, 0.5);
	RPG.ctx.fillStyle = "yellow";
	RPG.ctx.fillRect(RPG.player.target.x * RPG.scale, 0, 1, RPG.canvas.height);
	RPG.ctx.fillRect(0, RPG.player.target.y * RPG.scale, RPG.canvas.width, 1);
	*/
	RPG.ctx.restore();

}

function render_talk(time) {
	RPG.ctx.save();
	var room = RPG.map.rooms[RPG.map.y][RPG.map.x];
	if(false && roomy.color) {
		RPG.ctx.fillStyle = [
			"rgb(",
			Math.floor(room.color.r * 255), ",",
			Math.floor(room.color.g * 255), ",",
			Math.floor(room.color.b * 255),
			")"
		].join("");
	} else {
		RPG.ctx.fillStyle = "black";
	}
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);
	var prog = 1;
	if(time < RPG.modestart + 1000) {
		prog = (time - RPG.modestart) / 1000;
		RPG.player.p.walking = true;
	} else {
		RPG.player.p.walking = false;
	}

	text(RPG.player.p.name, 1 * 8, 1 * 8);
//	text(RPG.player.p.name, (15 - RPG.player.p.name.length) * 8, 1 * 8);

	draw(RPG.player.p, derp(-8, RPG.W / 3, prog), RPG.H / 4);

	if(RPG.talkto) {
		text(RPG.talkto.name, (15 - RPG.talkto.name.length) * 8, 1*8);
		draw(RPG.talkto, Math.floor(RPG.W * 2 / 3), RPG.H / 4);
	}
	if(RPG.baby) { // && Math.floor(RPG.tick / 5) % 2
		text(RPG.baby.name, (8 - (RPG.baby.name.length / 2)) * 8, 2*8);
		draw(RPG.baby, RPG.W / 2, RPG.H / 4);
	}

	RPG.ctx.fillStyle = "#226";
	RPG.ctx.fillRect(0, RPG.canvas.height / 2,
					 RPG.canvas.width,
					 RPG.canvas.height / 2);

	if(RPG.conv) {
		draw_conv();
		arrow(1, 8 * 14, 8 * 14);
	} else {
		draw_menu();
	}

	RPG.ctx.restore();
}

function render_map() {
	RPG.ctx.save();
	RPG.ctx.fillStyle = "black";
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);
	text("MAP", 8 * 6, 8 * 1);
	drawmap();
	arrow(0, 6 * 8, 14 * 8);
	text("OK", 7 * 8, 14 * 8);
	RPG.ctx.restore();
}

function render_trophies() {
	RPG.ctx.save();
	RPG.ctx.fillStyle = "black";
	RPG.ctx.fillRect(0, 0,
					 RPG.canvas.width,
					 RPG.canvas.height);
	var sx = 0;
	var sy = 4;
	[
		"FINISHED RPG1",
		"FULL EXPLORER",
		"TALKED TO ALL",
		"MAPLESS CROWN",
		"NOWHERE TO GO",
		"UNSEEN TALKER",
		"SINGLESEGMENT",
		"FIFTEEN GAMES",
		"TOO MANY KIDS",
		"MILE PER SHOE",
		"ALL BY MYSELF",
		"MAXIMUMUTANTS"
	].every(function(name, idx) {
		if(RPG.trophies[name]) {
			sy = 5;
			if(blink()) {
				sx = 1;
			}
			RPG.ctx.globalAlpha = 1;
		} else {
			sy = 4;
			RPG.ctx.globalAlpha = 0.5;
		}
		RPG.ctx.drawImage(RPG.text, sx * 8, sy * 8,
						  8, 8,
						  8 * RPG.scale,
						  (idx + 1) * 8 * RPG.scale,
						  8 * RPG.scale,
						  8 * RPG.scale);
		text(name, 2 * 8, (idx + 1) * 8);
		return true;
	});
	RPG.ctx.globalAlpha = 1;
	arrow(0, 6 * 8, 14 * 8);
	text("OK", 7 * 8, 14 * 8);
	RPG.ctx.restore();
}

function solid(x, y) {
// todo: accept a room and p and know its barriers
	if(RPG.mode !== "play") {
		return false;
	}
	var t = 32;
	var b = RPG.H - 32 - 8;
	var l = 32;
	var r = RPG.W - 32 - 8;
	if((x < l || x > r) && (y < t || y > b)) {
		return true;
	}
	t = l = 8;
	b = RPG.H - 8 - 8;
	r = RPG.W - 8 - 8;
	var room = RPG.map.rooms[RPG.map.y][RPG.map.x];
	var allow = RPG.player.p.feet;
	if(y < l && (!room.n || allow.indexOf(room.n) < 0)) {
		return true;
	}
	if(y > b && (!room.s || allow.indexOf(room.s) < 0)) {
		return true;
	}
	if(x < l && (!room.w || allow.indexOf(room.w) < 0)) {
		return true;
	}
	if(x > r && (!room.e || allow.indexOf(room.e) < 0)) {
		return true;
	}
	return false;
}

function seek(x, y) {
	//TODO: collision detection and stopping (set to -1)
	if(RPG.player.target.x >= 0) {
		if(RPG.player.x < RPG.player.target.x - 4 &&
		   !solid(RPG.player.x + 1, RPG.player.y)) {
			++RPG.player.x;
		} else if(RPG.player.x > RPG.player.target.x - 4 &&
				  !solid(RPG.player.x - 1, RPG.player.y)) {
			--RPG.player.x;
		} else {
			RPG.player.target.x = -1;
		}
	}
	if(RPG.player.target.y >= 0) {
		if(RPG.player.y < RPG.player.target.y - 4 &&
		   !solid(RPG.player.x, RPG.player.y + 1)) {
			++RPG.player.y;
		} else if(RPG.player.y > RPG.player.target.y - 4 &&
				  !solid(RPG.player.x, RPG.player.y - 1)) {
			--RPG.player.y;
		} else {
			RPG.player.target.y = -1;
		}
	}
}

function meander(who) {
	(who || []).every(function(p) {
		if(Math.random() < 0.01) {
			p.walking = !p.walking;
			p.dir = p.walking ? randomdirection() : "";
		}
		switch(p.dir) {
		case "n":
			if(!solid(p.x, p.y - 1)) {
				--p.y;
			} else {
				p.dir = "s";
			}
			if(p.y < 0) {
				p.dir = "s";
			}
			break;
		case "e":
			if(!solid(p.x + 1, p.y)) {
				++p.x;
			} else {
				p.dir = "w";
			}
			if(p.x > RPG.W - 8) {
				p.dir = "w";
			}
			break;
		case "s":
			if(!solid(p.x, p.y + 1)) {
				++p.y;
			} else {
				p.dir = "n";
			}
			if(p.y > RPG.H - 8) {
				p.dir = "n";
			}
			break;
		case "w":
			if(!solid(p.x - 1, p.y)) {
				--p.x;
			} else {
				p.dir = "e";
			}
			if(p.x < 0) {
				p.dir = "e";
			}
			break;
		default:
			break;
		}
		return true;
	});
}

function touching(npcs) {
	var touch = null;
	var x = RPG.player.x;
	var y = RPG.player.y;
	(npcs || []).every(function(p) {
//		touch = p;
		if(Math.max(x, p.x) - Math.min(x, p.x) <= 8 &&
		   Math.max(y, p.y) - Math.min(y, p.y) <= 8) {
			touch = p;
		}
		return !touch;
	});
	return touch;
}

function personalmenu(time) {
	RPG.modestart = time;
	RPG.mode = "talk";
	RPG.talkto = null;
	RPG.menu = [
		"NEVER MIND"
	];
	if(RPG.player.p.map) {
		RPG.menu.push("VIEW MAP");
	}
	RPG.menu.push(
		"VIEW TROPHIES",
		"SAVE AND QUIT"
	);
}

function talkmenu(time, npc) {
	RPG.modestart = time;
	RPG.mode = "talk";
	npc.walking = false;
	npc.dir = "";
	RPG.talkto = npc;
	if(!npc.talked || npc.talked.indexOf(RPG.player.p.name) < 0) {
		RPG.conv = [npc.greet];
		npc.talked = npc.talked || [];
		npc.talked.push(RPG.player.p.name);
	}
	if(!cansee([RPG.player.p], npc.face)) {
		trophy("UNSEEN TALKER");
	}
	if(check_alltalk()) {
		trophy("TALKED TO ALL");
	}
	RPG.menu = [
		"NEVER MIND",
		"BE ME"
	];
	if(check_population() < 120 && RPG.player.p.relatives.indexOf(RPG.talkto.name) < 0) {
		RPG.menu.push("MAKE OFFSPRING");
	}
	if(npc.map && !RPG.player.p.map) {
		RPG.menu.push("TAKE MY MAP");
	}
	if(npc.crown && !RPG.player.p.crown) {
		RPG.menu.push("TAKE MY CROWN");
	}
	if(npc.trade) {
		RPG.menu.push("TRADE " + npc.trade.toUpperCase());
	}
};

function tick(time) {
	var row = 0;
	var col = 0;
	switch(RPG.mode) {
	case "title":
	default:
		row = Math.floor(RPG.input.pointer.y / 8);
		if(localGet("game")) {
			row = Math.max(row, 10);
		} else {
			row = Math.max(row, 11);
		}
		row = Math.min(row, 12);
		RPG.arrow.show = true;
		RPG.arrow.x = 3 * 8;
		RPG.arrow.y = row * 8;
		if(RPG.input.up) {
			RPG.input.up = false;
			--row;
			RPG.input.pointer.y = row * 8;
		}
		if(RPG.input.down) {
			RPG.input.down = false;
			++row;
			RPG.input.pointer.y = row * 8;
		}
		if(RPG.input.action) {
			RPG.input.action = false;
			RPG.input.pointer.click = true;
		}
		if(RPG.input.pointer.click) {
			RPG.input.pointer.click = false;
			switch(row) {
			case 10: //continue
				init();
				break;
			case 11: //new game
				RPG.mode = "select";
				RPG.totals = RPG.totals || {};
				RPG.totals.games = RPG.totals.games || 0;
				++RPG.totals.games;
				if(RPG.totals.games >= 15) {
					trophy("FIFTEEN GAMES");
				}
				break;
			case 12: //manual
			default:
				var link = document.createElement("a");
				link.href = "manual.html";
				link.style.display = "hidden";
				document.body.appendChild(link);
				link.click();
				break;
			}
			break;
		}

		meander(RPG.p);

		break;
	case "select":
		if(RPG.ready) {
			col = Math.floor(RPG.input.pointer.x / 16);
			row = Math.floor(RPG.input.pointer.y / 16);
			row = Math.max(row, 2);
			row = Math.min(row, 7);
			col = Math.max(col, 0);
			col = Math.min(col, 7);

			RPG.arrow.show = true;
			RPG.arrow.type = 1;
			RPG.arrow.x = col * 16 + 4;
			RPG.arrow.y = row * 16 - 7;

			if(RPG.input.up) {
				RPG.input.up = false;
				--row;
				RPG.input.pointer.y = row * 16;
			}
			if(RPG.input.down) {
				RPG.input.down = false;
				++row;
				RPG.input.pointer.y = row * 16;
			}
			if(RPG.input.left) {
				RPG.input.left = false;
				--col;
				RPG.input.pointer.x = col * 16;
			}
			if(RPG.input.right) {
				RPG.input.right = false;
				++col;
				RPG.input.pointer.x = col * 16;
			}
			if(RPG.input.action) {
				RPG.input.action = false;
				RPG.input.pointer.click = true;
			}
			if(RPG.input.pointer.click) {
				RPG.input.pointer.click = false;
				RPG.ready = false;
				RPG.modeend = time + 2000;

				RPG.player.x = col * 16 + 4;
				RPG.player.y = row * 16;
				row -= 2;
				//console.log(row, col);
				RPG.player.p = RPG.p[(row * 8) + col];
			}
		} else {
			if(RPG.modeend && time > RPG.modeend) {
				RPG.mode = "play";
				RPG.modestart = time;
				RPG.modeend = 0;
				RPG.ready = true;
			} else {
				if(time < RPG.modeend - 1500) {
					RPG.arrow.show = Math.floor(RPG.tick / 5) % 2;
				} else {
					RPG.arrow.show = false;
				}
				RPG.player.target.x = RPG.W / 2;
				RPG.player.target.y = RPG.H / 2;
				seek();
				RPG.player.p.walking = (RPG.player.target.x >= 0 ||
										RPG.player.target.y >= 0);
			}
		}
		break;
	case "play":
		if(RPG.ready) {
			if(RPG.input.up) {
				RPG.player.target.y = RPG.player.y;
			}
			if(RPG.input.down) {
				RPG.player.target.y = RPG.player.y+8;
			}
			if(RPG.input.left) {
				RPG.player.target.x = RPG.player.x;
			}
			if(RPG.input.right) {
				RPG.player.target.x = RPG.player.x+8;
			}
			if(RPG.input.action) {
				RPG.input.action = false;
				var cont = touching(RPG.map.rooms[RPG.map.y][RPG.map.x].p);
				if(cont) {  // touch npc
					talkmenu(time, cont);
					break;
				} else {
					personalmenu(time);
					break;
				}
			}
			if(RPG.input.pointer.click) {
				RPG.input.pointer.click = false;
				if(RPG.input.pointer.x >= RPG.player.x &&
				   RPG.input.pointer.x <= RPG.player.x + 8 &&
				   RPG.input.pointer.y >= RPG.player.y &&
				   RPG.input.pointer.y <= RPG.player.y + 8) {
					var cont = touching(RPG.map.rooms[RPG.map.y][RPG.map.x].p);
					if(cont) {  // touch npc
						talkmenu(time, cont);
						break;
					} else {
						personalmenu(time);
						break;
					}
				}
				RPG.player.target.x = RPG.input.pointer.x;
				RPG.player.target.y = RPG.input.pointer.y;
			}

			if(RPG.tick % 2) {
				meander(RPG.map.rooms[RPG.map.y][RPG.map.x].p);
			}

			seek();
			RPG.player.p.walking = (RPG.player.target.x >= 0 ||
									RPG.player.target.y >= 0);

			if(RPG.player.x < 8) {
				RPG.scroll.dir = "w";
				RPG.scroll.target.x = RPG.map.x - 1;
				RPG.scroll.target.y = RPG.map.y;
				RPG.ready = false;
				RPG.player.target.x = RPG.player.target.y = -1;
			} else if(RPG.player.x > RPG.W - 16) {
				RPG.scroll.dir = "e";
				RPG.scroll.target.x = RPG.map.x + 1;
				RPG.scroll.target.y = RPG.map.y;
				RPG.ready = false;
				RPG.player.target.x = RPG.player.target.y = -1;
			} else if(RPG.player.y < 8) {
				RPG.scroll.dir = "n";
				RPG.scroll.target.x = RPG.map.x;
				RPG.scroll.target.y = RPG.map.y - 1;
				RPG.ready = false;
				RPG.player.target.x = RPG.player.target.y = -1;
			} else if(RPG.player.y > RPG.H - 16) {
				RPG.scroll.dir = "s";
				RPG.scroll.target.x = RPG.map.x;
				RPG.scroll.target.y = RPG.map.y + 1;
				RPG.ready = false;
				RPG.player.target.x = RPG.player.target.y = -1;
			}
		} else {
			if(RPG.scroll.dir) {
				++RPG.scroll.step;
				switch(RPG.scroll.dir) {
				case "n":
					RPG.player.y += 6;
					break;
				case "e":
					RPG.player.x -= 6;
					break;
				case "s":
					RPG.player.y -= 6;
					break;
				case "w":
				default:
					RPG.player.x += 6;
					break;
				}
				if(RPG.scroll.step >= 16) {
					RPG.map.x = RPG.scroll.target.x
					RPG.map.y = RPG.scroll.target.y;
					if(RPG.map.rooms[RPG.map.y][RPG.map.x]) {
						RPG.map.rooms[RPG.map.y][RPG.map.x].visited = true;
						if(check_allrooms()) {
							trophy("FULL EXPLORER");
						}
					}
					RPG.scroll.step = 0;
					RPG.scroll.target.x = RPG.scroll.target.y = -1;
					RPG.scroll.dir = "";
					RPG.ready = true;
				}
			}
		}
		break;
	case "talk":
		if(RPG.ready) {
			if(RPG.conv) {
				if(RPG.input.action ||
				   RPG.input.pointer.click) {
					RPG.input.action = false;
					RPG.input.pointer.click = false;
					RPG.conv = null;
				}
			} else if(RPG.menu) {
				row = Math.floor(RPG.input.pointer.y / 8);
				row = Math.max(row, 9);
				row = Math.min(row, 8 + RPG.menu.length);
				RPG.arrow.type = 0;
				RPG.arrow.show = true;
				RPG.arrow.x = 0;
				RPG.arrow.y = row * 8;
			}
			if(RPG.input.up) {
				RPG.input.up = false;
				--row;
				RPG.input.pointer.y = row * 8;
			}
			if(RPG.input.down) {
				RPG.input.down = false;
				++row;
				RPG.input.pointer.y = row * 8;
			}
			if(RPG.input.action ||
			   RPG.input.pointer.click) {
				RPG.input.action = false;
				RPG.input.pointer.click = false;
				var leave = menuhandle(row - 9);
				if(leave) {
					RPG.modeend = time + leave;
					RPG.ready = false;
				}
			}
		}
		if(RPG.modeend) {
			if(time > RPG.modeend) {
				RPG.baby = null;
				RPG.arrow.show = false;
				RPG.modestart = time;
				RPG.modeend = 0;
				RPG.mode = RPG.nextmode || "play";
				RPG.nextmode = "";
				if(RPG.mode === "title") {
					init(true);
				}
				RPG.ready = true;
				break;
			} else {
				RPG.arrow.show = Math.floor(RPG.tick / 5) % 2;
			}
		}
		break;
	case "map":
	case "trophies":
		RPG.ready = true;
		if(RPG.input.pointer.click ||
		   RPG.input.action) {
			RPG.input.action = false;
			RPG.input.pointer.click = false;
			RPG.mode = "play";
		}
		break;
	}
}

function render(time) {
	window.requestAnimationFrame(render);

	// call tick() at desired framerate regardless of draw framerate
	if(RPG.frametime) {
		RPG.frametime += time - RPG.lastframe;
	} else {
		RPG.frametime = time - RPG.lastframe;
	}
	while(RPG.frametime >= RPG.tickwait) {
		tick(time);
		RPG.tick++;
		RPG.frametime -= RPG.tickwait;
		RPG.frametime /= 1.5;  // HACK: prefer natural to exact fps
	}

	switch(RPG.mode) {
	default:
		render_title(time);
		break;
	case "select":
		render_select(time);
		break;
	case "play":
		render_play(time);
		break;
	case "talk":
		render_talk(time);
		break;
	case "map":
		render_map();
		break;
	case "trophies":
		render_trophies();
		break;
	}

	if(RPG.notice.until) {
		var sx = 0;
		var sy = 5;
		if(blink()) {
			sx = 1;
		}
		RPG.ctx.fillStyle = "black";
		RPG.ctx.fillRect(0, 0, RPG.canvas.width, RPG.canvas.height / 16);
		text(RPG.notice.text, 8, 0);
		if(RPG.notice.trophy) {
			RPG.ctx.drawImage(RPG.text,
							  sx * 8, sy * 8,
							  8, 8,
							  0, 0,
							  8 * RPG.scale,
							  8 * RPG.scale);

		}
		if(RPG.tick > RPG.notice.until) {
			RPG.notice.until = 0;
		}
	}
	if(RPG.arrow.show) {
		arrow(RPG.arrow.type, RPG.arrow.x, RPG.arrow.y);
	}

	RPG.lastframe = time;
}

function mousemove(e) {
	var x = e.clientX;
	var y = e.clientY;
	var elm = e.target
	while(elm && elm.offsetLeft !== undefined) {
		x -= elm.offsetLeft;
		y -= elm.offsetTop;
		elm = elm.offsetParent;
	}
	RPG.input.pointer.x = Math.floor(x / RPG.canvas.clientWidth * RPG.W);
	RPG.input.pointer.y = Math.floor(y / RPG.canvas.clientHeight * RPG.H);
}
function mousedown(e) {
	RPG.input.pointer.click = true;
}
function mouseup(e) {
	RPG.input.pointer.click = false;
}
function touchmove(e) {
	var touches = e.changedTouches;
	if(e.changedTouches && e.changedTouches.length) {
		e = e.changedTouches[0];
	}
	mousemove(e);
	e.preventDefault();
}

window.addEventListener("load", function() {
	RPG.canvas = document.querySelector("canvas");
	RPG.ctx = RPG.canvas.getContext("2d");
	RPG.ctx.imageSmoothingEnabled = false;
	RPG.ctx.mozImageSmoothingEnabled = false;
	RPG.ctx.webkitImageSmoothingEnabled = false;
	RPG.scale = RPG.canvas.width / RPG.W;
	RPG.text = document.querySelector("img#text");

	var stroph = localGet("trophies");
	try {
		//console.log(stroph);
		stroph = JSON.parse(stroph);
	} catch(ignore) {
		alert("corrupt trophy data ignored.");
		stroph = {};
	}
	RPG.trophies = stroph || {};

	init(true);
	RPG.canvas.addEventListener("mousemove", mousemove);
//	RPG.canvas.addEventListener("touchstart", touchmove);
//	RPG.canvas.addEventListener("touchmove", touchmove);
	RPG.canvas.addEventListener("mousedown", mousedown);
	RPG.canvas.addEventListener("mouseup", mouseup);
	RPG.canvas.addEventListener("mouseleave", mouseup);
	RPG.canvas.addEventListener("touchstart", function(e) {
		var touches = e.changedTouches;
		if(e.changedTouches && e.changedTouches.length) {
			e = e.changedTouches[0];
		}
		mousemove(e);
		mousedown(e);
	});

	window.requestAnimationFrame(render);
});

function handlekey(code, press) {
	if(!RPG.ready && press) {
		return;
	}
	switch(code) {
	case 38:  //up
	case 104: //num8
		//  case 75:  //k
	case 87:  //w
		// case 67:  //c
		RPG.input.up = press;
		break;
	case 40:  //down
	case 98:  //num2
		//  case 74:  //j
	case 83:  //s
		// case 68:  //d
		RPG.input.down = press;
		break;
	case 37:  //left
	case 100: //num4
		//  case 72:  //h
	case 65:  //a
		// case 69:  //e
		RPG.input.left = press;
		break;
	case 39:  //right
	case 102: //num6
		//  case 76:  //l
	case 68:  //d
		// case 70:  //f
		RPG.input.right = press;
		break;
	case 32:  //space
	case 17:  //ctrl
	case 18:  //alt
	case 13:  //enter
		// case 74:  //j
		RPG.input.action = press;
		break;
	default:
		 //   console.log(e.keyCode);
		break;
	}
}
window.addEventListener("keydown", function(e) {
	handlekey(e.keyCode, true);
});
window.addEventListener("keyup", function(e) {
	handlekey(e.keyCode, false);
});
