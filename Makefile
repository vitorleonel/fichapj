.PHONY: headers load

# Empty means the scripts' own defaults: scripts/local_add_headers/in and out.
SRC ?=
DST ?=
CSV ?=

headers:
	uv run scripts/local_add_headers/main.py $(if $(SRC),--in "$(SRC)") $(if $(DST),--out "$(DST)")

# Defaults to the output of `make headers`.
load:
	uv run scripts/local_load_dynamodb/main.py $(if $(CSV),--in "$(CSV)")
