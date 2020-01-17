
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

template = `
<tr>
    <td><a target="_blank" href="/get/beweb/author/{{id_beweb}}">{{id_beweb}}</a></td>
    <td>{{nome_visualizzazione}}</td>
    <td><a target="_blank" href="{{{wikidata}}}">{{wikidata_short}}</a></td>
    <td>{{data_inserimento}}</td>
    <td>{{numero_campi_modificati}}</td>
    <td>{{data_primo_cambiamento}}</td>
    <td>
        <ul>
        {{#differenze}}
            <li>
            <b>{{nome}}</b>
            <p>{{originale}} -> {{modificato}}<p>
            </li>
        {{/differenze}}
        </ul>
    </td>
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
            element.wikidata_short = element.wikidata.split("/").pop();
            element.data_inserimento = element.data_inserimento.split('T')[0]
            element.data_primo_cambiamento = element.data_primo_cambiamento.split('T')[0]
            output += Mustache.render(template, element);
        });
        $( "tbody" ).html(output);
    });
});