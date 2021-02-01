.PHONY : test

index.html : build.py objects/*.txt objects/fields.list personas/*.txt personas/fields.list
	python3 $<

test : build.py tests
	python3 -m pytest
