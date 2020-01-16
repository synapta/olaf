
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

template = `
<tr>
    <td><a href="/get/beweb/author/{{id_beweb}}">{{id_beweb}}</td>
    <td>{{wikidata}}</td>
    <td>{{data_inserimento}}</td>
    <td>{{numero_campi_modificati}}</td>
    <td>{{data_primo_cambiamento}}</td>
</tr>`;

// Get author, render author card, options and author labels
$(document).ready(() => {
    // Load alternative scripts
    $('table').tablesort()
        // Render navbar
    renderNavbar();
    // Load author list
    $.get(`/api/v1/${params.userToken}/author-list/`, (data) => {
        $("#loader").hide();
        let output = '';
        data.forEach(element => {
            output += Mustache.render(template, element);
        });
        $( "tbody" ).html(output);
    });
});