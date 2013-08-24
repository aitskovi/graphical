$(() ->
    module("add")

    test("Graph Construction", () ->
        # Basic Construction
        g = graphical.graph(null, null)
        deepEqual(g.vertices(), [])

        # Construction with Vertices
        g = graphical.graph(['a'], null)
        deepEqual(g.vertices(), ['a'])

        # Construction with Multiple Vertices 
        g = graphical.graph(['a', 'b'], null)
        deepEqual(g.vertices(), ['a', 'b'])

        # Construction with Duplicate Vertices 
        g = graphical.graph(['a', 'a'], null)
        deepEqual(g.vertices(), ['a'])
    )
)
