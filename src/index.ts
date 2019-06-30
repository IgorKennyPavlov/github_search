import { Observable, fromEvent, from, of } from 'rxjs';
import { debounceTime, pluck, switchMap, catchError, filter } from 'rxjs/operators';

interface Repo {
    name: string;
    description: string;
    html_url: string;
    owner: {
        avatar_url: string;
    };
}

interface GithubApiResponse {
    inpumplete_results: boolean;
    total_count: number;
    items: Repo[]
}

const searchInput: HTMLInputElement = document.getElementById('search') as HTMLInputElement;
const resultsBlock: HTMLInputElement = document.getElementById('results') as HTMLInputElement;

const inputChanged$: Observable<string> = fromEvent(searchInput, 'input')
    .pipe(
        debounceTime(500),
        pluck('target', 'value')
    );

const getRepos: Function = (searchString: string): Observable<GithubApiResponse | null> => {
    const base: string = 'https://api.github.com/search/repositories';
    const parsedSearchString: string = searchString.split(/[\s,]+/).join('+');

    return from(fetch(`${base}?q=${parsedSearchString}&sort=stars&order=desc`))
        .pipe(
            switchMap((data: Response): Observable<GithubApiResponse> => from(data.json())),
            catchError((error: TypeError) => {
                console.log(`An error occured. ${error}`);
                return of(null);
            })
        );
}

const search: Function = (input$: Observable<string>, request: Function): Observable<GithubApiResponse> => {
    return input$
        .pipe(
            filter((searchString: string): boolean => !!searchString.length),
            switchMap((searchString: string): Observable<GithubApiResponse> => request(searchString))
        )
}

const render: Function = (items: Repo[]): void => {
    resultsBlock.innerHTML = '';

    items.forEach((repo: Repo) => {
        const repoBlock = document.createElement('a');
        repoBlock.classList.add('repoBlock');
        repoBlock.href = repo.html_url;
        repoBlock.target = '_blank';

        const repoHeader = document.createElement('h2');
        repoHeader.innerText = repo.name;
        repoBlock.appendChild(repoHeader);

        const repoImage = document.createElement('img');
        repoImage.src = repo.owner.avatar_url;
        repoBlock.appendChild(repoImage);

        const repoDescription = document.createElement('p');
        repoDescription.innerText = repo.description;
        repoBlock.appendChild(repoDescription);

        resultsBlock.appendChild(repoBlock);
    });
}

search(inputChanged$, getRepos).subscribe((value: GithubApiResponse): void => render(value.items));