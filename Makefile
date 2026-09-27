.PHONY: headers load

# Empty means the scripts' own defaults: scripts/local_add_headers/in and out.
SRC ?=
DST ?=
CSV ?=
# Name prefix, to run a single dump instead of all of them.
ONLY ?=
# cnpj_basico prefix, to load a slice of the base instead of all of it.
PREFIX ?=

headers:
	uv run scripts/local_add_headers/main.py $(if $(ONLY),"$(ONLY)") $(if $(SRC),--in "$(SRC)") $(if $(DST),--out "$(DST)")

# Defaults to the output of `make headers`.
load:
	uv run scripts/local_load_dynamodb/main.py $(if $(CSV),--in "$(CSV)") $(if $(PREFIX),--prefix "$(PREFIX)")
