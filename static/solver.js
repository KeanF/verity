/// Verity Solver Engine (keanf)

const POSITIONS = {
    0: "Left",
    1: "Middle",
    2: "Right",
}

const SHAPES = {
    "c": "Circle",
    "s": "Square",
    "t": "Triangle",
}

const OUTSIDE_STATE_TRANSITIONS = {
    "ccsstt": ["cscstt", "ccstst", "ctssct"],
    "ttccss": ["ctctss", "stccst", "ttcscs"],
    "ttsscc": ["ststcc", "ctssct", "ttcscs"],
    "ccttss": ["ctctss", "csttcs", "ccstst"],
    "sscctt": ["cscstt", "stccst", "ssctct"],
    "ssttcc": ["ststcc", "csttcs", "ssctct"],
    "ccstst": ["csctst", "ctcsst", "csstct", "ctstcs", "ccttss", "ccsstt"],
    "stccst": ["ctcsst", "csctst", "ttccss", "sscctt", "stcsct", "stctcs"],
    "ststcc": ["ttsscc", "ssttcc", "ctstcs", "csstct", "stctcs", "stcsct"],
    "ttcscs": ["ttccss", "ttsscc", "ctstcs", "stctcs", "ctcsst", "stcsct"],
    "csttcs": ["stctcs", "ctstcs", "ssttcc", "ccttss", "csctst", "csstct"],
    "cscstt": ["sscctt", "ccsstt", "stcsct", "ctcsst", "csstct", "csctst"],
    "ssctct": ["csstct", "stcsct", "csctst", "stctcs", "ssttcc", "sscctt"],
    "ctssct": ["stcsct", "csstct", "ttsscc", "ccsstt", "ctcsst", "ctstcs"],
    "ctctss": ["ttccss", "ccttss", "stctcs", "csctst", "ctstcs", "ctcsst"],
    "csctst": ["stccst", "ccstst", "ctcsst", "ssctct", "stctcs", "ctctss", "csstct", "csttcs", "cscstt"],
    "csstct": ["ssctct", "stcsct", "ctssct", "ststcc", "ccstst", "ctstcs", "csctst", "csttcs", "cscstt"],
    "ctcsst": ["stccst", "ccstst", "csctst", "stcsct", "ttcscs", "cscstt", "ctssct", "ctstcs", "ctctss"],
    "ctstcs": ["stctcs", "ttcscs", "csttcs", "ststcc", "ccstst", "csstct", "ctctss", "ctcsst", "ctssct"],
    "stcsct": ["ctssct", "csstct", "ssctct", "ctcsst", "ttcscs", "cscstt", "ststcc", "stccst", "stctcs"],
    "stctcs": ["ctstcs", "ttcscs", "csttcs", "ctctss", "csctst", "ssctct", "ststcc", "stccst", "stcsct"],
};

/**
 * Computes a score [0, 6] of how solved a given outside state is. The lower the
 * score, the more solved the state is.
 * @param {String} solved   six-character string of a solved state; e.g. "ccsstt"
 * @param {String} state    six-character string of the current state
 * @returns {Number}        how solved the state is from [0, 6]
 */
function score(solved, state) {
    let s = 0;
    for (let i = 0; i < 6; i++) {
        if (solved[i] !== state[i]) {
            s += 1;
        }
    }
    return s;
}

/**
 * Determines if a given outside swap is closer to a valid solution by comparing
 * the scores of both states.
 * @param {String} solved   six-character string of a solved state; e.g. "ccsstt"
 * @param {String} prev     six-character string of the previous state
 * @param {String} curr     six-character string of the current state
 * @returns {Boolean}       true if swap is closer to a valid state, false otherwise
 */
function isGoodTransition(solved, prev, curr) {
    return score(solved, prev) > score(solved, curr)
}

/**
 * Retrieves a valid solution for a given inside callout. For challenge, we
 * will simply rotate shapes once right.
 * @param {String} inside         three-character string of the inside callout
 * @param {Boolean} isChallenge   whether challenge mode is active
 * @returns {String}              six-character string of a valid solution
 */
function getSolvedState(inside, isChallenge) {
    if (isChallenge) {
        return inside[2].repeat(2) + inside[0].repeat(2) + inside[1].repeat(2);
    }
    return inside.replace(/[cst]/g, function (c) {
        return { "c": "st", "s": "ct", "t": "cs" }[c];
    });
}

/**
 * Solve the outside state given the inside and outside callouts. This uses a
 * simple heuristic to greedily derive a solution. Assumes outside callouts
 * are alphabetized; e.g. "cs" not "sc"
 * @param {String} inside       three-character string of the inside callout
 * @param {String} outside      six-character string of the outside callout
 * @param {String} isChallenge  whether challenge mode is active
 * @returns {String[]}          states that outside transitioned between to solve
 */
function solve(inside, outside, isChallenge) {
    let solvedState = getSolvedState(inside, isChallenge);
    var prevState = outside;
    var states = [outside];

    while (prevState !== solvedState) {
        var bestScore = score(solvedState, prevState);
        var bestState = null;
        for (let newState of OUTSIDE_STATE_TRANSITIONS[prevState]) {
            let newScore = score(solvedState, newState);
            if (
                isGoodTransition(solvedState, prevState, newState)
                && bestScore > newScore
            ) {
                bestScore = newScore;
                bestState = newState;
            }
        }
        states.push(bestState);
        prevState = bestState;
    }

    return states;
}

/**
 * Derives the swap required to transition between two outside states.
 * @param {String} prev     six-character string of the previous state
 * @param {String} curr     six-character string of the current state
 * @returns {Array<[String, String]>}   tuples of [shape, position] to swap
 */
function deriveSwap(prev, curr) {
    var swap = []
    for (let i = 0; i < 6; i++) {
        let p = prev.charAt(i);
        if (p !== curr.charAt(i)) {
            swap.push([SHAPES[p], POSITIONS[Math.floor(i / 2)]]);
        }
    }
    return swap;
}

/**
 * Derives the swaps between an arbitrary number of states
 * @param {Array<String>} states    list of states outside progressed between
 * @returns {Array<Array<[String, String]>>}    transitions between states
 */
function deriveSwaps(states) {
    var swaps = [];
    for (let i = 0; i < states.length - 1; i++) {
        swaps.push(deriveSwap(states[i], states[i + 1]));
    }
    return swaps;
}

/**
 * Container for callouts. Tracks issues with a given callout, which will be
 * displayed in the "solution" section.
 */
class Callout {
    constructor() {
        this.inside = ["", "", ""];
        this.outside = ["", "", ""];
        this.issues = { "inside": "Awaiting inside callouts", "outside": "Awaiting outside callouts" };
    }

    /**
     * Resets callouts
     */
    reset() {
        this.inside = ["", "", ""];
        this.outside = ["", "", ""];
        this.issues = { "inside": "Awaiting inside callouts", "outside": "Awaiting outside callotus" };
    }

    /**
     * Populates a given callout, removing it if it was already selected prior.
     * Subsequently handles populating the right callout, if it is possible.
     * @param {String} shape        shape/volume that was selected, e.g. "s" or "st"
     * @param {String} pos          position of the shape, e.g. 0 -> "left"
     * @param {Boolean} isInside    whether this is an inside or outside callout
     */
    populate(shape, pos, isInside) {
        if (isInside) {
            this.#populateInside(shape, pos);
        } else {
            this.#populateOutside(shape, pos);
        }
    }

    #populateInside(shape, pos) {
        // De-select a previously input shape and clear the right shape
        if (this.inside[pos] !== "" && this.inside[pos] === shape) {
            this.inside[pos] = "";
            this.inside[2] = "";
            this.issues["inside"] = "Inside callout requires two shapes";
            return;
        }

        this.inside[pos] = shape;

        // Need two shapes before we can fill the right shape
        if (this.inside[0] === "" || this.inside[1] === "") {
            this.inside[2] = ""
            this.issues["inside"] = "Inside callout requires two shapes";
            return;
        }

        // Fill the right shape unless we have a duplicate
        switch (this.inside.slice(0, 2).join("")) {
            case "cs":
            case "sc":
                this.inside[2] = "t";
                break;
            case "ct":
            case "tc":
                this.inside[2] = "s";
                break;
            case "st":
            case "ts":
                this.inside[2] = "c";
                break;
            default:
                this.inside[2] = "";
                this.issues["inside"] = "Inside callout must contain unique shapes";
                return;
        }

        this.issues["inside"] = "";
    }

    #populateOutside(volume, pos) {
        // De-select a previously input volume and clear the right volume
        if (this.outside[pos] !== "" && this.outside[pos] === volume) {
            this.outside[pos] = "";
            this.outside[2] = "";
            this.issues["outside"] = "Outside callout requires two volumes";
            return;
        }

        this.outside[pos] = volume;

        // Need two volumes before we can fill the right shape
        if (this.outside[0] === "" || this.outside[1] === "") {
            this.outside[2] = "";
            this.issues["outside"] = "Outside callout requires two volumes";
            return;
        }

        // Fill the right volume unless an invalid set is present, i.e. 3+ of a given shape
        let outsideCalloutStr = this.outside.slice(0, 2).join("");
        let c = (outsideCalloutStr.match(/c/g) || "").length;
        let s = (outsideCalloutStr.match(/s/g) || "").length;
        let t = (outsideCalloutStr.match(/t/g) || "").length;
        switch (`${c}${s}${t}`) {
            case "022": // i.e. "sstt"
                this.outside[2] = "cc";
                break;
            case "202":
                this.outside[2] = "ss";
                break;
            case "220":
                this.outside[2] = "tt";
                break;
            case "112":
                this.outside[2] = "cs";
                break;
            case "121":
                this.outside[2] = "ct";
                break;
            case "211":
                this.outside[2] = "st";
                break;
            default:
                this.outside[2] = "";
                this.issues["outside"] = "Outside callout must be valid";
                return false;
        }

        this.issues["outside"] = "";
    }

    hasIssues() {
        return this.issues["inside"] !== "" || this.issues["outside"] !== "";
    }

    hasCallouts() {
        return this.inside.some((c) => c !== "") || this.outside.some((c) => c !== "");
    }
}

/**
 * Nicely format the steps taken to arrive at an outside solution
 * @param {String[]} states     states that outside went through
 * @returns {String[]}
 */
function prettifySolution(states) {
    var solution = [];
    if (isChallenge) {
        solution.push("Challenge is active!");
    }
    let swaps = deriveSwaps(states);
    swaps.map(function (swap, step) {
        solution.push(`Step ${step + 1}: dissect ${swap[0][0]} from ${swap[0][1]}, ${swap[1][0]} from ${swap[1][1]}`);
    })
    return solution;
}

/**
 * Inject text into the solution body (global)
 * @param {String[]} corpus   steps taken to solve outside, or issues with callouts
 */
function replaceSolutionBody(corpus) {
    var elems = []
    for (let elem of corpus) {
        let p = document.createElement("P");
        p.innerHTML = elem;
        elems.push(p);
    }
    solutionBody.replaceChildren(...elems);
}

/**
 * Updates the solution body. If there are no issues with the callouts, then
 * display the steps to solve. If there are, display such issues.
 * @param {Boolean} reset   reset the style of the box
 */
function updateSolutionBody(reset) {
    var solutionText = []
    if (callout.hasIssues()) {
        solutionText.push(callout.issues["inside"]);
        solutionText.push(callout.issues["outside"]);
        solutionBody.style.backgroundColor = "#942217";
    } else {
        states = solve(callout.inside.join(""), callout.outside.join(""), isChallenge);
        swaps = prettifySolution(states, isChallenge);
        solutionText = swaps;
        solutionBody.style.backgroundColor = "#0b450b";
    }
    if (reset) {
        solutionBody.style.backgroundColor = "#202020";
    }
    replaceSolutionBody(solutionText);
}

/**
 * Toggles highlight of selected button
 * @param {Boolean} isInside whether the button is inside or outside
 * @param {Boolean} isLeft whether the button is a left or mid callout
 * @param {String} name literal of the button
 */
function updateActiveCalloutButton(isInside, isLeft, name) {
    buttonGroup = document.getElementById(`${isInside ? "inside" : "outside"}-${isLeft ? "left" : "mid"}`);
    for (let button of buttonGroup.children) {
        if (button.name === name && !button.classList.contains("active")) {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    }
}

/**
 * Removes highlight of all callout buttons
 */
function resetCalloutButtons() {
    for (let button of buttons) {
        button.classList.remove("active");
    }
}

/**
 * Toggles highlight of challenge, green if enabled, red if not.
 */
function updateChallengeButton() {
    if (isChallenge) {
        challengeButton.innerHTML = "Challenge Active";
        challengeButton.classList.add("challenge-active");
        challengeButton.classList.remove("challenge-inactive");
    } else {
        challengeButton.innerHTML = "Challenge Inactive";
        challengeButton.classList.add("challenge-inactive");
        challengeButton.classList.remove("challenge-active");
    }
}

function updateShowImagesButton() {
    if (canShowImages) {
        showImagesButton.innerHTML = "Hide Images";
    } else {
        showImagesButton.innerHTML = "Show Images";
    }
}

function updateImages() {
    for (let image of shapeImages) {
        if (canShowImages) {
            image.style.display = "inline-flex";
        } else {
            image.style.display = "none";
        }
    }
}

// Globals
var callout = new Callout();
var isChallenge = false;
var canShowImages = false;

// Parts of the DOM that can be manipulated
const solutionBody = document.getElementById("solution");
const shapeImages = document.getElementsByTagName("img");

// Buttons that can manipulate the DOM
const challengeButton = document.getElementById("challenge");
const resetButton = document.getElementById("reset");
const showImagesButton = document.getElementById("images");

// Callout buttons
const buttons = document.getElementsByTagName("button");
for (let button of buttons) {
    let isLeft = button.name.includes("left");
    let isInside = button.name.includes("inside");
    let isOutside = button.name.includes("outside");

    if (isInside || isOutside) {
        button.addEventListener("click", function () {
            callout.populate(button.value, isLeft ? 0 : 1, isInside);
            updateActiveCalloutButton(isInside, isLeft, button.name);
            updateSolutionBody(false);
        });
    }
}

challengeButton.addEventListener("click", function () {
    isChallenge = !isChallenge;
    updateChallengeButton();
    updateSolutionBody(false);
});

resetButton.addEventListener("click", function () {
    callout.reset();
    resetCalloutButtons();
    updateSolutionBody(true);
});

showImagesButton.addEventListener("click", function () {
    canShowImages = !canShowImages;
    updateShowImagesButton();
    updateImages();
});