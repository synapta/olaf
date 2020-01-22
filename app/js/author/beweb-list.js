
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

template = `
<tr id='{{id_beweb}}'>
    <td class="ui center aligned">
        <div class="ui inline loader"></div>
        <div class="ui vertical animated button scarta-icon-button" data-info='{{{json}}}' tabindex="0">
            <div class="hidden content">Scarta segnalazione</div>
                <div class="visible content">
                <i class="trash alternate outline icon"></i>
            </div>
        </div>
    </td>
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
            console.log( JSON.stringify(element))
            element.json = JSON.stringify(element);
            output += Mustache.render(template, element);
        });
        $( "tbody" ).html(output);

        $(".scarta-icon-button").each(function() {
            var $this = $(this);



            $this.on("click", function() {
                $this.hide();
                $this.closest('td').find('.loader').toggleClass('active')
                let info = $(this).data('info');
                let id = info.id_beweb
                info.Idrecord = info.id_beweb;
                info.Visualizzazione_su_BEWEB = info.nome_visualizzazione;
                info.Wikidata = info.wikidata;

                $.ajax({
                    type: "POST",
                    url: `/api/v1/${params.userToken}/add-author-again`,
                    data: info,
                    success: function(aaa){ 
                        console.log(id)
                        $("#" + id).remove();
                    },
                    error: function (xhr, error) {
                        console.debug("ERRORRRRRRR",xhr); 
                        console.debug(error);
                    }
                });
            });
        });
    });
});

