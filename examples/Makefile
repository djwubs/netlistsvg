YOSYS    ?= yosys
INKSCAPE ?= inkscape
VIEWER   ?= eog

YOSYS_FLAGS ?= -q
# YOSYS_FLAGS ?= -Q -T

# Node JS is sometimes installed as node and sometimes as nodejs
ifneq ($(shell which node),)
NODE	 ?= node
else
ifneq ($(shell which nodejs),)
NODE     ?= nodejs
else
$(error "Can not find node(js), please set $$NODE to the node binary")
endif
endif

NETLISTSVG = ../bin/netlistsvg
NETLISTSVG_SKIN ?= ../lib/default.svg
NETLISTSVG_DPI  ?= 300

# Simple files are the same flattened as not
SIMPLE_FILES=dff.v muxcy.v xorcy.v
# Complex files are different when flattened
COMPLEX_FILES=carry4bits.v carry4whole.v

ALL_TARGETS= \
	     $(foreach v,$(SIMPLE_FILES) ,$(basename $(v)).simple.all) \
	     $(foreach v,$(COMPLEX_FILES),$(basename $(v)).complex.all)

GET_TOP ?= export TOP=$$(echo $(basename $<) | tr a-z A-Z);

# Top level diagram
%.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP; write_json -compat-int $@" $<

# Split wires, can make it easier for the diagram if nets are split up
%.split.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP; splitnets; write_json -compat-int $@" $<

# Flatten the diagram into logic + black boxes
%.flat.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP -flatten; write_json -compat-int $@" $<

# Convert logic into AND and NOT logic
%.aig.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP -flatten; cd $$TOP; aigmap; write_json -compat-int $@" $<

# Convert logic into NAND, AND and NOT logic
%.naig.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP -flatten; cd $$TOP; aigmap -nand; write_json -compat-int $@" $<

# Convert logic into "simple logic" - NOT, AND, XOR, etc
%.simplemap.json: %.v Makefile
	$(GET_TOP) $(YOSYS) $(YOSYS_FLAGS) -p "prep -top $$TOP -flatten; cd $$TOP; simplemap; write_json -compat-int $@" $<

# Use netlistsvg to generate SVG files
%.svg: %.json $(NETLISTSVG_SKIN)
	$(NODE) $(NETLISTSVG) $< -o $@ --skin $(NETLISTSVG_SKIN)

# Generate all PNGs for simple files
%.simple.all: %.svg %.aig.svg
	@true

# Generate all PNGS for complex files
%.complex.all: %.svg %.split.svg %.flat.svg %.aig.svg %.simplemap.svg
	@true

# Build everything!
build.all: $(ALL_TARGETS)
	@true

clean:
	rm -f *.json *.svg *.png

all:
	make build.all

.DEFAULT_GOAL := all
.PRECIOUS: %.svg
.PHONY: view clean all
