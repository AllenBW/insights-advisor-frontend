import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { routerParams } from '@red-hat-insights/insights-frontend-components';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import { connect } from 'react-redux';
import {
    Ansible,
    Battery,
    PageHeader,
    PageHeaderTitle,
    Pagination,
    SortDirection,
    Table,
    Main
} from '@red-hat-insights/insights-frontend-components';
import { Stack, StackItem } from '@patternfly/react-core';
import * as AppActions from '../../AppActions';
import Loading from '../../PresentationalComponents/Loading/Loading';
import './_actions.scss';

class ViewActions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            summary: '',
            cols: [
                'Rule',
                'Likelihood',
                'Impact',
                'Total Risk',
                'Systems',
                'Ansible'
            ],
            rows: [],
            sortBy: {},
            itemsPerPage: 10,
            page: 1,
            things: []
        };
        this.onSortChange = this.onSortChange.bind(this);
        this.toggleCol = this.toggleCol.bind(this);
        this.limitRows = this.limitRows.bind(this);
        this.setPage = this.setPage.bind(this);
        this.setPerPage = this.setPerPage.bind(this);
    }

    componentDidMount() {
        document.getElementById('root').classList.add('actions__view');
        // TODO: implement server supported pagination in this component, page_size 1000? wtf yo 😏
        // TODO: filtering based on route will also be done here, but waiting for api...
        this.props.fetchRules({ page_size: 1000 }); // eslint-disable-line camelcase
    }

    componentDidUpdate(prevProps) {
        const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max)) + 1;

        if (this.props.rules !== prevProps.rules) {
            const rules = this.props.rules.results;
            this.setState({ summary: this.props.rules.summary });

            let rows = [];
            rules.map((value, key) => {
                rows.push({
                    cells: [
                        <Link
                            key={ key }
                            to={ `/actions/${this.props.match.params.type }/${
                                value.rule_id
                            }` }
                        >
                            { value.description }
                        </Link>,
                        <Battery
                            key={ key }
                            label='Likelihood'
                            labelHidden
                            severity={ value.rec_likelihood  || getRandomInt(4) }
                        />,
                        <Battery
                            key={ key }
                            label='Impact'
                            labelHidden
                            severity={ value.rec_impact  || getRandomInt(4) }
                        />,
                        <Battery
                            key={ key }
                            label='Total Risk'
                            labelHidden
                            severity={ value.resolution_risk  || getRandomInt(4) }
                        />,
                        <div key={ key }>{ value.hitCount  || getRandomInt(100) }</div>,
                        <Ansible
                            key={ key }
                            unsupported={ value.ansible }
                        />
                    ]
                });
            });

            this.setState({ rows });
        }
    }

    toggleCol(_event, key, selected) {
        let { rows, page, itemsPerPage } = this.state;
        const firstIndex = page === 1 ? 0 : page * itemsPerPage - itemsPerPage;
        rows[firstIndex + key].selected = selected;
        this.setState({
            ...this.state,
            rows
        });
    }

    onSortChange(_event, key, direction) {
        const sortedRows = sortBy(this.state.rows, [ e => e.cells[key] ]);
        this.setState({
            ...this.state,
            rows: SortDirection.up === direction ? sortedRows : sortedRows.reverse(),
            sortBy: {
                index: key,
                direction
            }
        });
    }

    limitRows() {
        const { page, itemsPerPage } = this.state;
        const numberOfItems = this.state.rows.length;
        const lastPage = Math.ceil(numberOfItems / itemsPerPage);
        const lastIndex = page === lastPage ? numberOfItems : page * itemsPerPage;
        const firstIndex = page === 1 ? 0 : page * itemsPerPage - itemsPerPage;
        return this.state.rows.slice(firstIndex, lastIndex);
    }

    setPage(page) {
        this.setState({
            ...this.state,
            page
        });
    }

    setPerPage(amount) {
        this.setState({
            ...this.state,
            itemsPerPage: amount
        });
    }

    parseUrlTitle(title = '') {
        const parsedTitle = title.split('-');
        return parsedTitle.length > 1 ? `${parsedTitle[0]} ${parsedTitle[1]} Actions` : `${parsedTitle}`;
    }

    render() {
        const {
            rulesFetchStatus
        } = this.props;
        const rows = this.limitRows();
        return (
            <React.Fragment>
                <PageHeader>
                    <PageHeaderTitle
                        className='actions__view--title'
                        title={ this.parseUrlTitle(this.props.match.params.type) }
                    />
                </PageHeader>
                <Main>
                    <Stack gutter='md'>
                        <StackItem>
                            <p>{ this.state.summary }</p>
                        </StackItem>
                        <StackItem className='advisor-l-actions__filters'>
              Filters
                        </StackItem>
                        { rulesFetchStatus === 'fulfilled' && (
                            <StackItem className='advisor-l-actions__table'>
                                <Table
                                    className='rules-table'
                                    onItemSelect={ this.toggleCol }
                                    hasCheckbox={ false }
                                    header={ this.state.cols }
                                    sortBy={ this.state.sortBy }
                                    rows={ rows }
                                    onSort={ this.onSortChange }
                                    footer={
                                        <Pagination
                                            numberOfItems={ this.state.rows.length }
                                            onPerPageSelect={ this.setPerPage }
                                            page={ this.state.page }
                                            onSetPage={ this.setPage }
                                            itemsPerPage={ this.state.itemsPerPage }
                                        />
                                    }
                                />
                            </StackItem>
                        ) }
                        { rulesFetchStatus === 'pending' && (<Loading />) }
                    </Stack>
                </Main>
            </React.Fragment>
        );
    }
}

ViewActions.propTypes = {
    match: PropTypes.any,
    fetchRules: PropTypes.func,
    rulesFetchStatus: PropTypes.string,
    rules: PropTypes.object
};

const mapStateToProps = (state, ownProps) => ({
    rules: state.AdvisorStore.rules,
    rulesFetchStatus: state.AdvisorStore.rulesFetchStatus,
    ...ownProps
});

const mapDispatchToProps = dispatch => ({
    fetchRules: (url) => dispatch(AppActions.fetchRules(url))
});

export default routerParams(connect(
    mapStateToProps,
    mapDispatchToProps
)(ViewActions));

